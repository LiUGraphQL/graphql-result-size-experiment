import { createLoaders } from '../loaders.js';
import { typeDefs, resolvers } from '../schema.js';
import { queryCalculator } from 'graphql-result-size';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { makeServer } from '../server.js';
import { rawRequest } from 'graphql-request';
import { calculateResultSize } from './utils.js';
import { vars } from './query-type-tests-vars.js';
import chai from 'chai';

describe('Query type tests', () => {
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
                threshold: 1000000,
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

    describe('cyclic', () => {
        it('cyclic 1', (done) => {
            const q = 0;
            const query = vars.cyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql(vars.cyclicResults[q]);
                done();
            }).catch(e => done(e));
        });

        it('cyclic 2', (done) => {
            const q = 1;
            const query = vars.cyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql(vars.cyclicResults[q]);
                done();
            }).catch(e => done(e));
        });

        it('cyclic 3', (done) => {
            const q = 2;
            const query = vars.cyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql(vars.cyclicResults[q]);
                done();
            }).catch(e => done(e));
        });
    });

    describe('acyclic', () => {
        it('acyclic 1', (done) => {
            const q = 0;
            const query = vars.acyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                //chai.expect(data).to.eql(vars.acyclicResults[q]);
                done();
            }).catch(e => done(e));
        });
        
        it('acyclic 2', (done) => {
            const q = 1;
            const query = vars.acyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                //chai.expect(data).to.eql(vars.acyclicResults[q]);
                done();
            }).catch(e => done(e));
        });

        it('acyclic 3', (done) => {
            const q = 2;
            const query = vars.acyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                //chai.expect(data).to.eql(vars.acyclicResults[q]);
                done();
            }).catch(e => done(e));
        });
    });

    describe('varying', () => {
        it('varying 1', (done) => {
            const q = 0;
            const query = vars.varyingQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                //chai.expect(data).to.eql(vars.varyingResults[q]);
                done();
            }).catch(e => done(e));
        });
        
        it('varying 2', (done) => {
            const q = 1;
            const query = vars.varyingQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                //chai.expect(data).to.eql(vars.varyingResults[q]);
                done();
            }).catch(e => done(e));
        });

        it('varying 3', (done) => {
            const q = 2;
            const query = vars.acyclicQueries[q];
            rawRequest(url, query).then(({ data, extensions }) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                //chai.expect(data).to.eql(vars.varyingResults[q]);
                done();
            }).catch(e => done(e));
        });
    });
});