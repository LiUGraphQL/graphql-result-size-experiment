import { ApolloServer } from 'apollo-server';

function makeServer(config) {
    const server = new ApolloServer(config);
    return server;
}

export {
    makeServer
}