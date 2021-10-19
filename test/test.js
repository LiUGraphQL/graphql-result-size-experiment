const { makeServer } = require('../server');
const { request, rawRequest } = require('graphql-request');


function makeQueryInner(depth){
    if(depth === 0){
        return '{ nr }';
    }
    return `{ reviews { reviewFor ${makeQueryInner(depth-1)} } }`;
}

function makeQuery(depth){
    return `{ Product(nr:6) ${makeQueryInner(depth)} }`;
}

describe('Tests', () => {
    let testServer;
    let url = 'http://localhost:4000/graphql';
    before((done) => {
        makeServer().listen(4000).then(server => {
            testServer = server;
            done();
        });
    })

    after((done) => {
        testServer.server.close(done);
    })

    it('test1', (done) => {
        let q = makeQuery(1);
        let t0 = new Date();
        rawRequest(url, q).then(({data, extensions, err}) => {
            console.log("errors=", err);
            console.log("extensions=", extensions);
            console.log("data=", data);
            done();
        }).catch(err => {
            done(err)
        });
        let t1 = new Date();
        console.log(`${t1-t0} ms`)
    });
})