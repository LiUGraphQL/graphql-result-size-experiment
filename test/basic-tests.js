const { createLoaders } = require('../loaders.js');
const { typeDefs, resolvers } = require('../schema.js')
const { queryCalculator } = require('../calculate/calculate.js');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { makeServer } = require('../server.js');
const { rawRequest } = require('graphql-request');
const { calculateResultSize } = require('./utils.js')

const chai = require('chai')

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

    describe('single scalar', () => {
        it('single ID value', (done) => {
            const query = '{ Product(nr:6){ nr } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Product: { nr: 6 } });
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('single string value', (done) => {
            const query = '{ Product(nr:6){ label } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Product: { label: 'liars drinker' } });
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

        it('object null value', (done) => {
            const query = '{ Product(nr:0){ nr } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({ Product: null });
                done();
            }).catch(e => {
                done(e);
            });
        });
    });
    
    describe('object array', () => {
        it('ID value', (done) => {
            const query = '{ Product(nr:6){ reviews { nr } } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({"Product":{"reviews":[{"nr":1172},{"nr":1487},{"nr":2242},{"nr":4708},{"nr":5124}]}});
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('string value', (done) => {
            const query = '{ Product(nr:6){ reviews { title } } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({"Product":{"reviews":[{"title":"teazelling manipulating queerly coracle seaports nauseam maladies solves craal chlorination dislocate valerian"},{"title":"christianized airframes sticker lockjaw unconscionable antiparliamentarians burred errantly calculation capful nonfictional"},{"title":"futurologists bluchers unobjectionable punny rotting fusileers hardhats mislabels kinematics chrisms preparers spigots hyperglycemic cougher dandlers"},{"title":"nonzebra delicatessens likings unchanging cacophonously mucked assures unpolitical milkmaid constancy purposelessness"},{"title":"sticked enjoins blankness swampish lamplighter fusiliers"}]}});
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('int value', (done) => {
            const query = '{ Product(nr:6){ reviews { rating1 } } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({"Product":{"reviews":[{"rating1":1},{"rating1":null},{"rating1":3},{"rating1":null},{"rating1":null}]}});
                done();
            }).catch(e => {
                done(e);
            });
        });

        it('object null value', (done) => {
            const query = '{ Product(nr:0){ reviews { rating1 } } }';
            rawRequest(url, query).then(({data, extensions}) => {
                const { resultSize } = extensions.calculate;
                chai.assert.equal(resultSize, calculateResultSize(data));
                chai.expect(data).to.eql({"Product":null});
                done();
            }).catch(e => {
                done(e);
            });
        });
    });
});