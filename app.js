import { setDB, createLoaders } from './loaders.js';
import { typeDefs, resolvers } from './schema.js';
import { queryCalculator } from 'graphql-result-size';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { makeServer } from './server.js';
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2), {
    default: {
        port: 4000,
        terminateEarly: true,
        threshold: 100000,
        timeout: 120000,
        useQueryCalculator: 'true'
    },
});

if(argv.db){
    setDB(argv.db);
}

const threshold = argv.threshold;
const timeout = argv.timeout;
const terminateEarly = argv.terminateEarly != 'false';
const executor = argv.useQueryCalculator != 'false' ? queryCalculator: null;

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
        schema,
        timeout,
        terminateEarly
    },
    executor
};

makeServer(config).listen(argv.port).then(server => {
    console.log(`Server has started at ${server.url}`);
});