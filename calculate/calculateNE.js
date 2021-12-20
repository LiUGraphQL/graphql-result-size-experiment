/*
This is basically the the implementation of the query calculator before the support
for early termination was added. Note that this is more representative for testing
than simply disabling early termination using a flag, since this would add an extra
cost to the algorithm. 
*/
module.exports = { queryCalculatorNE };

const _ = require('lodash');
const deleteKey = require('key-del');
const { print } = require('graphql');
const {
    createNode,
    getRootNode,
    nodeType
} = require('./functions');
const {
    buildExecutionContext,
    buildResolveInfo,
    getFieldDef
} = require('graphql/execution/execute.js');
const { getArgumentValues } = require('graphql/execution/values.js');
const { ApolloError } = require('apollo-server-errors');

/**
 * Initializes the label, size, and result maps, and runs the calculate function
 * with the top level query and root node.
 * 
 * Throws an error if the resulting size is above the given threshold.
 * 
 * @param  {object} requestContext contains query and GraphQL schema
 * @return {object}                returns the query result in JSON format
 */
function queryCalculatorNE(requestContext) {
    // Build execution context 
    const { request, document } = requestContext;
    const variableValues = request.variables;
    const operationName = request.operationName;
    const contextValue = requestContext.context;
    const schema = contextValue.schema;
    const rootValue = contextValue.rootValue;
    const fieldResolver = contextValue.fieldResolver;
    const typeResolver = contextValue.undeftypeResolver;
    const exeContext = buildExecutionContext(schema, document, rootValue, contextValue, variableValues, operationName, fieldResolver, typeResolver);
    const fieldNodes = document.definitions[0].selectionSet.selections;

    // Additional parameters needed for the calculation
    const calculationContext = {
        exeContext,
        fieldNodes,
        threshold: contextValue.threshold,
        errorCode: undefined
    };

    const structures = {
        labelMap: new Map(),
        sizeMap: new Map(),
        resultMap: new Map(),
        hits: 0
    };

    // Parse query to remove location properties
    const query = deleteKey(document.definitions[0].selectionSet.selections, 'loc');
    const rootNodeType = schema.getQueryType();
    const rootNode = getRootNode(rootNodeType);
    const parentForResolvers = contextValue.rootValue;

    return populateDataStructures(structures, rootNode, rootNodeType, query, parentForResolvers, calculationContext, undefined)
        .then(resultSize => {
            let curKey = getMapKey(rootNode, query);
            let calculate = {
                resultSize,
                cacheHits: structures.hits,
                resultSizeLimit: calculationContext.threshold
            }

            if (resultSize > calculationContext.threshold) {
                throw new ApolloError(`Query result of ${resultSize} exceeds the maximum size of ${calculationContext.threshold}`,
                    'RESULT_SIZE_LIMIT_EXCEEDED', calculate);
            }

            // Create result
            let result = {
                data: JSON.parse(`{ ${produceResult(structures.resultMap, curKey)} }`),
                extensions: { calculate }
            };
            return result;
        })
}

/**
 * Creates a key for the given pair of data node and (sub)query to be used for
 * look ups.
 */
function getMapKey(u, query) {
    return JSON.stringify([u, print(query)]);
}

/**
 * Recursive function that populates the given data structures to determine the result size of a GraphQL query
 * and to produce the query result.
 *
 * Based on an extended version of Algorithm 2 in the research paper "Semantics and Complexity of GraphQL"
 * by Olaf Hartig and Jorge Pérez. The extended version combines the calculation algorithm from the original
 * paper with gathering additional data that can be used to produce the query results without accessing the 
 * underlying data source again. A detailed explanation of this algorithm can be found in the Master's thesis 
 * "Combining Result Size Estimation and Query Execution for the GraphQL Query Language" by Andreas Lundquist.
 *
 * @param  {object} structures          contains three map structures: labels, sizes and results
 * @param  {object} u                   node
 * @param  {object} uType               a GraphQL object representing the type of the given node
 * @param  {object} query               (sub)query to be calculated
 * @param  {object} parentForResolvers  current parent object to be passed to the resolver functions
 * @param  {object} calculationContext  contains additional information needed for the calculation
 * @param  {object} path                contains the path from the root node to the current node
 * @return {promise}
 * @private
 */
async function populateDataStructures(structures, u, uType, query, parentForResolvers, calculationContext, path) {
    // Create keys for data structures
    const mapKey = getMapKey(u, query);
    const subqueryAsString = JSON.stringify(query);
    const curnodeAsString = JSON.stringify(u);

    // Check whether the given (sub)query has already been considered for the
    // given data node, which is recorded in the 'labels' data structure
    // (this corresponds to line 1 in the pseudo code of the algorithm)
    if (!queryAlreadyConsideredForNode(structures.labelMap, curnodeAsString, subqueryAsString)) {
        // Record that the given (sub)query has been considered for the given data node
        // (this corresponds to line 2 in the pseudo code of the algorithm)
        markQueryAsConsideredForNode(structures.labelMap, curnodeAsString, subqueryAsString);
        // ...and initialize the 'results' data structure
        // (this is not explicitly captured in the pseudo code)
        initializeDataStructures(structures.resultMap, mapKey);

        // Continue depending on the form of the given (sub)query
        let sizePromise = null;
        if (query.length > 1) {
            // The (sub)query is a concatenation of multiple (sub)queries
            // (this corresponds to line 46 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForAllSubqueries(structures, query, mapKey, u, uType, parentForResolvers, calculationContext, path);
        } else if (!(query[0].selectionSet)) {
            // The (sub)query requests a single, scalar-typed field
            // (this corresponds to line 3 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForScalarField(structures, mapKey, uType, query[0], parentForResolvers, calculationContext, path);
        } else if (query[0].kind === 'Field') {
            // The (sub)query requests a single field with a subselection
            // (this corresponds to line 10 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForObjectField(structures, mapKey, uType, query[0], parentForResolvers, calculationContext, path);
        } else if (query[0].kind === 'InlineFragment') {
            // The (sub)query is an inline fragment
            // (this corresponds to line 40 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForInlineFragment(structures, mapKey, u, uType, query[0], parentForResolvers, calculationContext, path);
        }
        structures.sizeMap.set(mapKey, sizePromise);
        return sizePromise;
    }
    else {
        /* The query already exists in labels for this node */
        structures.hits += 1;        
        return structures.sizeMap.get(mapKey);
    }
}

function queryAlreadyConsideredForNode(labelMap, curnodeAsString, subqueryAsString) {
    return (_.some(labelMap.get(curnodeAsString), function (o) {
        return o === subqueryAsString;
    }));
}

function markQueryAsConsideredForNode(labelMap, curnodeAsString, subqueryAsString) {
    if (!labelMap.has(curnodeAsString)) {
        labelMap.set(curnodeAsString, [subqueryAsString]);
    } else {
        labelMap.get(curnodeAsString).push(subqueryAsString);
    }
}

/* Initializes the results data structure if it has not been initialized before */
function initializeDataStructures(resultMap, mapKey) {
    if (!resultMap.has(mapKey)) {
        resultMap.set(mapKey, []);
    }
}

/*
 * Updates the given data structures for all subqueries of the given (sub)query.
 * This corresponds to lines 47-55 in the pseudo code of the algorithm.
 */
async function updateDataStructuresForAllSubqueries(structures, query, mapKey, u, uType, parentForResolvers, calculationContext, path) {    
    return Promise.all(query.map((subquery, index) => {
        if (index !== 0) {
            structures.resultMap.get(mapKey).push(",");
        }

        let mapKeyForSubquery = getMapKey(u, [subquery]);
        structures.resultMap.get(mapKey).push([mapKeyForSubquery]);
        // get into the recursion for each subquery
        return populateDataStructures(structures, u, uType, [subquery], parentForResolvers, calculationContext, path);
    }))
        .then(subquerySizes => {
            let size = subquerySizes.length - 1; // for the commas
            subquerySizes.forEach(subquerySize => {
                size += subquerySize;
            });
            return Promise.resolve(size);
        });
}

/*
 * Updates the given data structures for a scalar-typed field.
 * This corresponds to lines 3-9 in the pseudo code of the algorithm.
 */
function updateDataStructuresForScalarField(structures, mapKey, uType, subquery, parentForResolvers, calculationContext, path) {
    let fieldName = subquery.name.value;
    let fieldDef = uType.getFields()[fieldName];
    if (fieldDef == undefined) {
        fieldDef = getFieldDef(calculationContext.schema, uType, fieldName);
    }
    path = extendPath(path, fieldName);
    return resolveField(subquery, uType, fieldDef, parentForResolvers, calculationContext, path)
        .then(result => {
            return updateDataStructuresForScalarFieldValue(structures, mapKey, result, fieldName, calculationContext);
        });
}

/**
 * Used by updateDataStructuresForScalarField.
 */
function updateDataStructuresForScalarFieldValue(structures, mapKey, result, fieldName, calculationContext) {
    let value;
    let size = 0;
    if (Array.isArray(result)) {
        size += 2 + result.length;
        if (result.length <= 1) {
            result = result[0];
        } else {
            _.forEach(result, function (element, index) {
                if (typeof element === "string") {
                    result[index] = "\"" + element + "\"";
                }
            });
        }
    } else {
        size += 3;
    }
    const sizePromise = Promise.resolve(size);

    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
        value = result[fieldName];
    } else if (Array.isArray(result)) {
        value = [];
        value.push("[");
        _.forEach(result, function (element, index) {
            if (index !== 0) {
                value.push(",");
            }
            value.push(element);
        });
        value.push("]");
    } else {
        value = result;
    }
    if (typeof value === "string") {
        value = "\"" + value + "\"";
    }
    structures.resultMap.get(mapKey).push("\"" + fieldName + "\"" + ":");
    structures.resultMap.get(mapKey).push(value);
    return sizePromise;
}

/*
 * Updates the given data structures for a object-typed fields (i.e., fields that have a selection set).
 * This corresponds to lines 11-39 in the pseudo code of the algorithm.
 */
function updateDataStructuresForObjectField(structures, mapKey, uType, subquery, parentForResolvers, calculationContext, path) {
    let fieldName = subquery.name.value;
    let fieldDef = uType.getFields()[fieldName];
    path = extendPath(path, fieldName);
    return resolveField(subquery, uType, fieldDef, parentForResolvers, calculationContext, path)
        .then(result => {
            // extend data structures to capture field name and colon
            structures.resultMap.get(mapKey).push("\"" + fieldName + "\"" + ":");

            // extend data structures to capture the given result fetched for the object field
            return updateDataStructuresForObjectFieldResult(result, structures, mapKey, subquery, fieldDef, parentForResolvers, calculationContext, path)
                .then(subquerySize => {
                    return Promise.resolve(subquerySize + 2);
                });
        });
}

/**
 * Used by updateDataStructuresForObjectField.
 */
async function updateDataStructuresForObjectFieldResult(result, structures, mapKey, subquery, fieldDef, parentForResolvers, calculationContext, path) {
    // update uType for the following recursion
    const relatedNodeType = (fieldDef.astNode.type.kind === 'ListType') ?
        fieldDef.type.ofType :
        fieldDef.type;
    // proceed depending on the given result fetched for the object field
    let resultPromise;
    if (result == null) { // empty/no sub-result
        structures.resultMap.get(mapKey).push("null");
        resultPromise = Promise.resolve(1); // for 'null'
    } else if (Array.isArray(result)) {
        structures.resultMap.get(mapKey).push("[");
        return Promise.all(result.map((resultItem, index) => {
            if (index !== 0) {
                structures.resultMap.get(mapKey).push(",");
            }
            const newParentForResolvers = resultItem;
            return updateDataStructuresForObjectFieldResultItem(structures, subquery, relatedNodeType, fieldDef, mapKey, newParentForResolvers, calculationContext, path);
        }))
            .then(resultItemSizes => {
                structures.resultMap.get(mapKey).push("]");
                let size = 2;                        // for '[' and ']'
                size += resultItemSizes.length - 1;  // for the commas
                resultItemSizes.forEach(resultItemSize => size += resultItemSize);
                return Promise.resolve(size);
            });
    } else { // sub-result is a single object
        const newParentForResolvers = result;
        resultPromise = updateDataStructuresForObjectFieldResultItem(structures, subquery, relatedNodeType, fieldDef, mapKey, newParentForResolvers, calculationContext, path);
    }
    return resultPromise;
}

/**
 * Used by updateDataStructuresForObjectFieldResult.
 */
function updateDataStructuresForObjectFieldResultItem(structures, subquery, relatedNodeType, fieldDef, mapKey, parentForResolvers, calculationContext, path) {
    let relatedNode = createNode(parentForResolvers, fieldDef);
    let mapKeyForRelatedNode = getMapKey(relatedNode, subquery.selectionSet.selections);
    // The following block should better be inside the 'then' block below, but it doesn't work correctly with the referencing in results.
    // extend the corresponding resultMap entry
    structures.resultMap.get(mapKey).push("{");
    structures.resultMap.get(mapKey).push([mapKeyForRelatedNode]);
    structures.resultMap.get(mapKey).push("}");
    
    // get into the recursion for the given result item
    return populateDataStructures(structures, relatedNode, relatedNodeType, subquery.selectionSet.selections, parentForResolvers, calculationContext, path)
        .then(subquerySize => {
            return Promise.resolve(subquerySize + 2); // +2 for '{' and '}'
        });
}

/*
 * Updates the given data structures for inline fragments.
 * This corresponds to lines 41-45 in the pseudo code of the algorithm.
 */
function updateDataStructuresForInlineFragment(structures, mapKey, u, uType, query, parentForResolvers, calculationContext, path) {
    let onType = query.typeCondition.name.value;
    if (nodeType(u) === onType) {
        let subquery = query.selectionSet.selections;
        let mapKeyForSubquery = getMapKey(u, subquery);
        structures.resultMap.get(mapKey).push([mapKeyForSubquery]);
        const uTypeNew = fieldInfo.exeContext.schema.getType(onType);
        return populateDataStructures(structures, u, uTypeNew, subquery, parentForResolvers, calculationContext, path);
    } else {
        return Promise.resolve(0); // the sub-result will be the empty string
    }
}

function extendPath(prev, key) {
    return { prev: prev, key: key };
}

/**
 * Builds the resolver info and args, then executes the corresponding resolver function.
 */
function resolveField(subquery, nodeType, fieldDef, parentForResolvers, calculationContext, path) {
    let resolveFn = fieldDef.resolve;
    let info = buildResolveInfo(calculationContext.exeContext, fieldDef, calculationContext.fieldNodes, nodeType, path);
    let args = (0, getArgumentValues(fieldDef, subquery, calculationContext.exeContext.variableValues));
    return Promise.resolve(resolveFn(parentForResolvers, args, calculationContext.exeContext.contextValue, info));
}

/** Produces the result from the results structure into a string.
 * index is a combination of a node and a query
 * each element in results is either a string or another index
 * if the element is a string it is just added to the response
 * else it is another index, in which case the function is run recursively
 */
function produceResult(resultMap, index) {
    if (resultMap == null) {
        return "";
    }
    let response = "";
    resultMap.get(index).forEach(element => {
        if (Array.isArray(element) && element.length > 1) {
            _.forEach(element, function (subElement) {
                response += subElement;
            });
        } else if (typeof element === "object" && element !== null) {
            response += produceResult(resultMap, element[0]);
        } else if (element === undefined || element == null) {
            response += null;
        } else {
            response += element;
        }
    });
    return response;
}