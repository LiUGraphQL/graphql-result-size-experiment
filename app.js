const { makeServer } = require('./server.js');
makeServer().listen(4000).then(server => {
    console.log(`Server has started at ${server.url}`);
});