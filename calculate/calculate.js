/*!
 * graphql-result-size
 * Copyright(c) 2018 Tim Andersson
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = { queryCalculator, produceResult };

/**
 * Module dependencies.
 * @private
 */

const _ = require('lodash');
const deleteKey = require('key-del');
const {
    GraphQLError,
    print
} = require('graphql');
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
const { size } = require('lodash');
/**
 * queryCalculator - calling function for the recursive calculation algorithm.
 *
 * Initializes the labels, sizeMap, and resultsMap maps, and runs the calculate function
 * with the top level query and root node. Compares the threshold to the calculated
 * value and throws an error if the size is above the given threshold.
 * 
 * @param  {object} requestContext contains query and GraphQL schema
 * @return {object}                returns the query result in JSON format
 */
 function queryCalculator(requestContext) {
    const { request, document } = requestContext;
    const variableValues = request.variables;
    const operationName = request.operationName;
    const contextValue = requestContext.context;
    const schema = contextValue.schema;
    const rootValue = contextValue.rootValue;
    const fieldResolver = contextValue.fieldResolver;
    const typeResolver = contextValue.undeftypeResolver;
    const exeContext = buildExecutionContext(schema, document, rootValue, contextValue, variableValues, operationName, fieldResolver, typeResolver)
    const fieldNodes = document.definitions[0].selectionSet.selections;
    // Additional parameters needed for the calculation
    const calculationContext = {
        exeContext,
        fieldNodes,
        threshold: contextValue.threshold,
        terminateEarly: contextValue.terminateEarly
    };

    const structures = {
         labels: new Map(),
         sizeMap: new Map(),
         resultsMap: new Map(),
         hits: 0
    };
    
    /* Parse query to remove location properties */
    const query = deleteKey(document.definitions[0].selectionSet.selections, 'loc');
    const rootNodeType = schema.getQueryType();
    const rootNode = getRootNode(rootNodeType);
    const parentForResolvers = contextValue.rootValue;

    return populateDataStructures(structures, rootNode, rootNodeType, query, parentForResolvers, calculationContext, undefined)
        .then(resultSize => {
            let curKey = getSizeMapKey(rootNode, query);
            let calculate = {
                resultSize,
                cacheHits: structures.hits,
                terminateEarly: calculationContext.terminateEarly,
                resultSizeLimit: calculationContext.threshold
            }
            // Throw error if size exceeds limit
            if (resultSize > calculationContext.threshold) {
                throw new ApolloError(`Query result of ${resultSize} exceeds the maximum size of ${calculationContext.threshold}`, 'RESULT_SIZE_LIMIT_EXCEEDED', calculate);
            }
            // Get the result and add
            let result = {
                data: JSON.parse(`{ ${produceResult(structures.resultsMap, curKey)} }`),
                extensions: {
                    calculate
                } 
            };
            return result;
        })
        .catch(e => {
            throw e;
        });
}


/**
 * Creates a key for the given pair of data node and (sub)query to be used for
 * look ups in the sizeMap and in the resultsMap.
 */
function getSizeMapKey(u, query) {
    return JSON.stringify([u, print(query)]);
}

/**
 * A recursive function that populates the given data structures to determine the result size of a GraphQL query
 * and to produce that query result later.
 *
 * Based on an extended version of Algorithm 2 in the research paper "Semantics and Complexity of GraphQL"
 * by Olaf Hartig and Jorge Pérez. The extended version combines the calculation algorithm from the original
 * paper with gathering additional data that can be used to produce the query results without accessing the 
 * underlying data source again. A detailed explanation of this algorithm can be found in the Master's thesis 
 * "Combining Result Size Estimation and Query Execution for the GraphQL Query Language" by Andreas Lundquist.
 *
 * @param  {object} structures          contains three map structures: labels, sizeMap and resultsMap
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
    // The following three strings are used as keys in the data structures
    // that are populated by the algorithm (labels, sizeMap, and resultsMap)
    let sizeMapKey = getSizeMapKey(u, query);
    let subqueryAsString = JSON.stringify(query);
    let curnodeAsString = JSON.stringify(u);
    // Check whether the given (sub)query has already been considered for the
    // given data node, which is recorded in the 'labels' data structure
    // (this corresponds to line 1 in the pseudo code of the algorithm)
    if (!queryAlreadyConsideredForNode(structures.labels, curnodeAsString, subqueryAsString)) {
        // Record that the given (sub)query has been considered for the given data node
        // (this corresponds to line 2 in the pseudo code of the algorithm)
        markQueryAsConsideredForNode(structures.labels, curnodeAsString, subqueryAsString);
        // ...and initialize the resultsMap data structure
        // (this is not explicitly captured in the pseudo code)
        initializeDataStructures(structures.resultsMap, sizeMapKey);
        // Now continue depending on the form of the given (sub)query.
        let sizePromise = null;
        if (query.length > 1) {
            // The (sub)query is a concatenation of multiple (sub)queries
            // (this corresponds to line 46 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForAllSubqueries(structures, query, sizeMapKey, u, uType, parentForResolvers, calculationContext, path);
        }
        else if (!(query[0].selectionSet)) {
            // The (sub)query requests a single, scalar-typed field
            // (this corresponds to line 3 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForScalarField(structures, sizeMapKey, uType, query[0], parentForResolvers, calculationContext, path);
        }
        else if (query[0].kind === 'Field') {
            // The (sub)query requests a single field with a subselection
            // (this corresponds to line 10 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForObjectField(structures, sizeMapKey, uType, query[0], parentForResolvers, calculationContext, path);
        }
        else if (query[0].kind === 'InlineFragment') {
            // The (sub)query is an inline fragment
            // (this corresponds to line 40 in the pseudo code of the algorithm)
            sizePromise = updateDataStructuresForInlineFragment(structures, sizeMapKey, u, uType, query[0], parentForResolvers, calculationContext, path);
        }
        structures.sizeMap.set(sizeMapKey, sizePromise);
        return sizePromise;
    }
    else {
        /* The query already exists in labels for this node */
        structures.hits += 1;
        return structures.sizeMap.get(sizeMapKey);
    }
}

function queryAlreadyConsideredForNode(labels, curnodeAsString, subqueryAsString) {
    return (_.some(labels.get(curnodeAsString), function (o) {
        return o === subqueryAsString;
    }));
}

function markQueryAsConsideredForNode(labels, curnodeAsString, subqueryAsString) {
    if (!labels.has(curnodeAsString)) {
        labels.set(curnodeAsString, [subqueryAsString]);
    } else {
        labels.get(curnodeAsString).push(subqueryAsString);
    }
}

/* Initializes the resultsMap data structure if it has not been initialized before */
function initializeDataStructures(resultsMap, sizeMapKey) {
    if (!resultsMap.has(sizeMapKey)) {
        resultsMap.set(sizeMapKey, []);
    }
}

/*
 * Updates the given data structures for all subqueries of the given (sub)query.
 * This corresponds to lines 47-55 in the pseudo code of the algorithm.
 */
async function updateDataStructuresForAllSubqueries(structures, query, sizeMapKey, u, uType, parentForResolvers, calculationContext, path) {
    return Promise.all(query.map((subquery, index) => {
        if (index !== 0) {
            structures.resultsMap.get(sizeMapKey).push(",");
        }
        let sizeMapKeyForSubquery = getSizeMapKey(u, [subquery]);
        structures.resultsMap.get(sizeMapKey).push([sizeMapKeyForSubquery]);
        // get into the recursion for each subquery
        return populateDataStructures(structures, u, uType, [subquery], parentForResolvers, calculationContext, path);
    }))
        .then(subquerySizes => {
            let size = subquerySizes.length - 1; // for the commas
            subquerySizes.forEach(subquerySize => {
                size += subquerySize;
                if(size > calculationContext.threshold && calculationContext.terminateEarly){
                    let calculate = {
                        resultSize: size,
                        cacheHits: structures.hits,
                        terminateEarly: calculationContext.terminateEarly,
                        resultSizeLimit: calculationContext.threshold
                    }
                    throw new ApolloError(`Query result of ${size} exceeds the maximum size of ${calculationContext.threshold}`, 'EARLY_TERMINATION_RESULT_SIZE_LIMIT_EXCEEDED', calculate);
                }
            });
            return Promise.resolve(size);
        });
}

/*
 * Updates the given data structures for a scalar-typed field.
 * This corresponds to lines 3-9 in the pseudo code of the algorithm.
 */
function updateDataStructuresForScalarField(structures, sizeMapKey, uType, subquery, parentForResolvers, calculationContext, path) {
    let fieldName = subquery.name.value;
    let fieldDef = uType.getFields()[fieldName];
    if(fieldDef == undefined){
        fieldDef = getFieldDef(calculationContext.schema, uType, fieldName);
    }
    path = extendPath(path, fieldName);
    return resolveField(subquery, uType, fieldDef, parentForResolvers, calculationContext, path)
        .then(result => {
            return updateDataStructuresForScalarFieldValue(structures, sizeMapKey, result, fieldName, calculationContext);
        });
}

/**
 * Used by updateDataStructuresForScalarField.
 */
function updateDataStructuresForScalarFieldValue(structures, sizeMapKey, result, fieldName, calculationContext) {
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

    if(size > calculationContext.threshold && calculationContext.terminateEarly){
        let calculate = {
            resultSize: size,
            cacheHits: structures.hits,
            terminateEarly: calculationContext.terminateEarly,
            resultSizeLimit: calculationContext.threshold
        }
        throw new ApolloError(`Query result of ${size} exceeds the maximum size of ${calculationContext.threshold}`, 'EARLY_TERMINATION_RESULT_SIZE_LIMIT_EXCEEDED', calculate);
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
    structures.resultsMap.get(sizeMapKey).push("\"" + fieldName + "\"" + ":");
    structures.resultsMap.get(sizeMapKey).push(value);
    return sizePromise;
}

/*
 * Updates the given data structures for a object-typed fields (i.e., fields that have a selection set).
 * This corresponds to lines 11-39 in the pseudo code of the algorithm.
 */
function updateDataStructuresForObjectField(structures, sizeMapKey, uType, subquery, parentForResolvers, calculationContext, path) {
    let fieldName = subquery.name.value;
    let fieldDef = uType.getFields()[fieldName];
    path = extendPath(path, fieldName);
    return resolveField(subquery, uType, fieldDef, parentForResolvers, calculationContext, path)
        .then(result => {
            // extend data structures to capture field name and colon
            structures.resultsMap.get(sizeMapKey).push("\"" + fieldName + "\"" + ":");
            // extend data structures to capture the given result fetched for the object field
            return updateDataStructuresForObjectFieldResult(result, structures, sizeMapKey, subquery, fieldDef, parentForResolvers, calculationContext, path)
                .then(subquerySize => {
                    let size = subquerySize + 2;  // +2 for field name and colon

                    if(size > calculationContext.threshold && calculationContext.terminateEarly){
                        let calculate = {
                            resultSize: size,
                            cacheHits: structures.hits,
                            terminateEarly: calculationContext.terminateEarly,
                            resultSizeLimit: calculationContext.threshold
                        }
                        throw new ApolloError(`Query result of ${size} exceeds the maximum size of ${calculationContext.threshold}`, 'EARLY_TERMINATION_RESULT_SIZE_LIMIT_EXCEEDED', calculate);
                    }
                    return Promise.resolve(subquerySize + 2);
                });
        });
}

/**
 * Used by updateDataStructuresForObjectField.
 */
async function updateDataStructuresForObjectFieldResult(result, structures, sizeMapKey, subquery, fieldDef, parentForResolvers, calculationContext, path) {
    // update uType for the following recursion
    const relatedNodeType = (fieldDef.astNode.type.kind === 'ListType') ?
        fieldDef.type.ofType :
        fieldDef.type;
    // proceed depending on the given result fetched for the object field
    let resultPromise;
    if (result == null) { // empty/no sub-result
        structures.resultsMap.get(sizeMapKey).push("null");
        resultPromise = Promise.resolve(1); // for 'null'
    } else if (Array.isArray(result)) {
        structures.resultsMap.get(sizeMapKey).push("[");
        return Promise.all(result.map((resultItem, index) => {
            if (index !== 0) {
                structures.resultsMap.get(sizeMapKey).push(",");
            }
            const newParentForResolvers = resultItem;
            return updateDataStructuresForObjectFieldResultItem(structures, subquery, relatedNodeType, fieldDef, sizeMapKey, newParentForResolvers, calculationContext, path);
        }))
            .then(resultItemSizes => {
                structures.resultsMap.get(sizeMapKey).push("]");
                let size = 2;                        // for '[' and ']'
                size += resultItemSizes.length - 1;  // for the commas
                resultItemSizes.forEach(resultItemSize => size += resultItemSize);
                return Promise.resolve(size);
            });
    } else { // sub-result is a single object
        const newParentForResolvers = result;
        resultPromise = updateDataStructuresForObjectFieldResultItem(structures, subquery, relatedNodeType, fieldDef, sizeMapKey, newParentForResolvers, calculationContext, path);
    }
    return resultPromise;
}

/**
 * Used by updateDataStructuresForObjectFieldResult.
 */
function updateDataStructuresForObjectFieldResultItem(structures, subquery, relatedNodeType, fieldDef, sizeMapKey, parentForResolvers, calculationContext, path) {
    let relatedNode = createNode(parentForResolvers, fieldDef);
    let sizeMapKeyForRelatedNode = getSizeMapKey(relatedNode, subquery.selectionSet.selections);
    // The following block should better be inside the 'then' block below, but it doesn't work correctly with the referencing in resultsMap.
    // extend the corresponding resultsMap entry
    structures.resultsMap.get(sizeMapKey).push("{");
    structures.resultsMap.get(sizeMapKey).push([sizeMapKeyForRelatedNode]);
    structures.resultsMap.get(sizeMapKey).push("}");
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
function updateDataStructuresForInlineFragment(structures, sizeMapKey, u, uType, query, parentForResolvers, calculationContext, path) {
    let onType = query.typeCondition.name.value;
    if (nodeType(u) === onType) {
        let subquery = query.selectionSet.selections;
        let sizeMapKeyForSubquery = getSizeMapKey(u, subquery);
        structures.resultsMap.get(sizeMapKey).push([sizeMapKeyForSubquery]);
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

/** Produces the result from the resultsMap structure into a string.
 * index is a combination of a node and a query
 * each element in resultsMap is either a string or another index
 * if the element is a string it is just added to the response
 * else it is another index, in which case the function is run recursively
 */
function produceResult(resultsMap, index) {
    if (resultsMap == null) {
        return "";
    }
    let response = "";
    resultsMap.get(index).forEach(element => {
        if (Array.isArray(element) && element.length > 1) {
            _.forEach(element, function (subElement) {
                response += subElement;
            });
        } else if (typeof element === "object" && element !== null) {
            response += produceResult(resultsMap, element[0]);
        } else if (element === undefined || element == null) {
            response += null;
        } else {
            response += element;
        }
    });
    return response;
}