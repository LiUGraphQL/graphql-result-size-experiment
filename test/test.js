const { makeServer } = require('../server');
const { request, rawRequest } = require('graphql-request');
let server;
let url = 'http://localhost:4000/graphql';

function makeQueryInner(depth){
    if(depth === 0){
        return '{ label }';
    }
    return `{ reviews { reviewFor ${makeQueryInner(depth-1)} } }`;
}

function makeQuery(depth){
    return `{ Product(nr:6) ${makeQueryInner(depth)} }`;
}

describe('Tests', () => {
    before((done) => {
        server = makeServer();
        setTimeout(() => done(), 500)
    })

    it('test1', () => {
        let q = makeQuery(2);
        let t0 = new Date();
        rawRequest(url, q).then(({data, extensions}) => {
            console.log(JSON.stringify(data, 2));
            console.log(JSON.stringify(extensions, 2));
        }).catch(err => {
            console.log(err)
        });
        let t1 = new Date();
        console.log(`${t1-t0} ms`)
    });
    
    //after(() => server.close())
})