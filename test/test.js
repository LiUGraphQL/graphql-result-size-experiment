const { createLoaders } = require('../loaders.js');
const { typeDefs, resolvers } = require('../schema.js')
const { queryCalculator } = require('../calculate/calculate.js');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { makeServer } = require('../server.js');
const { request, rawRequest } = require('graphql-request');
const { calculateResultSize } = require('./utils.js')

const chai = require('chai')

describe('Test counting', () => {
    let testServer;
    let url = 'http://localhost:4000/graphql';

    before((done) => {
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
                terminateEarly: false,
                schema
            },
            executor: queryCalculator
        };

        makeServer(config).listen(4000).then(server => {
            testServer = server;
            done();
        });
    })

    after((done) => {
        testServer.server.close(done);
    })

    describe('scalar', () => {
        it('single value', (done) => {
            const query = '{ Product(nr:6){ nr } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('single null value', (done) => {
            const query = '{ Product(nr:0){ nr } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                done();
            }).catch(e => {
                done(e);
            });
        });
    });
});