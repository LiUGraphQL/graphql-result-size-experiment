const { createLoaders } = require('./loaders.js');
const { typeDefs, resolvers } = require('./schema.js')
const { queryCalculator } = require('./calculate/calculate.js');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { makeServer } = require('./server.js');

const argv = require('minimist')(process.argv.slice(2), {
    default: {
        port: 4000,
        useQueryCalculator: true,
        terminateEarly: false,
        threshold: 10000
    },
});

const threshold = argv.threshold;
const terminateEarly = argv.terminateEarly == 'true' ? true : false;
const executor = argv.useQueryCalculator != 'false' ? queryCalculator : null;

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
        threshold,
        terminateEarly,
        schema
    },
    executor
};

makeServer(config).listen(argv.port).then(server => {
    console.log(`Server has started at ${server.url}`);
});