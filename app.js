
const { createLoaders } = require('./loaders.js');
const { typeDefs, resolvers } = require('./schema.js')
const { queryCalculator } = require('./calculate/calculate.js');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { makeServer } = require('./server.js');

const schema = makeExecutableSchema({
    typeDefs,
    resolvers
});

const config = {
    schema,
    dataSources: () => {
        return { loaders: createLoaders() }
    },
    context: {
        threshold: 10000,
        terminateEarly: true,
        schema
    },
    executor: queryCalculator // choose executor here
};

makeServer(config).listen(4000).then(server => {
    console.log(`Server has started at ${server.url}`);
});