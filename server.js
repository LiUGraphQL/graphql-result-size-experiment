const { ApolloServer } = require('apollo-server');

function makeServer(config) {
    const server = new ApolloServer(config);
    return server;
}

module.exports = {
    makeServer
}