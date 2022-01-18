import { createLoaders } from '../loaders.js';
import { typeDefs, resolvers } from './resources/test-schema.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { makeServer } from '../server.js';
import { rawRequest } from 'graphql-request';
import chai from 'chai';
import { queryCalculator } from 'graphql-result-size';
import { calculateResultSize } from './utils.js';


describe('Basic tests', () => {
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
        it('single ID value', (done) => {
            const query = '{ Person(nr:1){ nr } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Person: { nr: 1 } });
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('single string value', (done) => {
            const query = '{ Person(nr:1){ name } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Person: { name: 'Ruggiero-Delane' } });
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('single int value', (done) => {
            const query = '{ Review(nr:1){ rating2 } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Review: { rating2: 10 } });
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('single int null value', (done) => {
            const query = '{ Review(nr:1){ rating1 } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Review: { rating1: null } });
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('array of strings', (done) => {
            const query = '{ Review(nr:1){ ratings } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.expect(resultSize).to.eql(calculateResultSize(data));
                chai.expect(data).to.eql({ Review: { ratings: [ null, 10, 10, null ] } });
                done();
            }).catch(e => {
                done(e);
            });
        });
    });

    describe('object', () => {
        it('array query', (done) => {
            const query = '{ Persons(limit:3){ nr } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Persons: [ { nr: 1 }, { nr: 2 }, { nr: 3 }] });
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('object field', (done) => {
            const query = '{ Person(nr:1){ reviews { nr } } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({"Person":{"reviews":[{"nr":1},{"nr":2},{"nr":3},{"nr":4},{"nr":5},{"nr":6},{"nr":7},{"nr":8},{"nr":9},{"nr":10},{"nr":11},{"nr":12},{"nr":13},{"nr":14},{"nr":15}]}});
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('object array field', (done) => {
            const query = '{ Review(nr:1){ reviewer { nr } } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Review: { reviewer: { nr: 1 } } });
                done();
            }).catch(e => {
                done(e);
            });
        });
    }); 
});