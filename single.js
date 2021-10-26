const { rawRequest } = require('graphql-request');


let q = `{ Product(nr:6) { nr } }`;
let url = 'http://localhost:4000/graphql';

rawRequest(url, q).then((resp) => {
    console.log(JSON.stringify(resp, null, 2));
}).catch(err => {
    console.log(JSON.stringify(err, null, 2))
});
