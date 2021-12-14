const { setDB, createLoaders } = require('./loaders.js');
const { typeDefs, resolvers } = require('./schema.js')
const { queryCalculator } = require('./calculate/calculate.js');
const { queryCalculatorNE } = require('./calculate/calculateNE.js');
const { queryCalculator } = require('./calculate/calculate.js');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { makeServer } = require('./server.js');

const argv = require('minimist')(process.argv.slice(2), {
    default: {
        port: 4000,
        terminateEarly: true,
        threshold: 10000
    },
});

if(argv.db){
    setDB(argv.db);
}

const threshold = argv.threshold;
const executor = argv.terminateEarly != 'false' ? queryCalculator : queryCalculatorNE;
console.log("executor:", executor);

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
        schema
    },
    executor
};

makeServer(config).listen(argv.port).then(server => {
    console.log(`Server has started at ${server.url}`);
});