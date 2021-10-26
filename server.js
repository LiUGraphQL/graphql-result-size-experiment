const { ApolloServer } = require('apollo-server');
const { db, createLoaders } = require('./loaders.js');
const { typeDefs, resolvers } = require('./schema.js')
const { queryCalculator } = require('./calculate/calculate.js');

const { makeExecutableSchema } = require('@graphql-tools/schema');

function makeServer() {
    const schema = makeExecutableSchema({
        typeDefs,
        resolvers
    });

    // Create instance of server
    const server = new ApolloServer({
        schema,
        // data sources are added to the global 'context' since it will be used by the resolvers
        // Pass theshold as part of the context object
        dataSources: () => {
            return { loaders: createLoaders() }
        },
        context: {
            threshold: 5,
            terminateEarly: true,
            schema
        },
        executor: queryCalculator
    });

    return server;
}

module.exports = {
    makeServer
}