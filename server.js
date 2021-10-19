const { ApolloServer } = require('apollo-server');
const { db, createLoaders } = require('./loaders.js');
const { typeDefs, resolvers } = require('./schema.js')

/*
var express = require('express');
var bodyParser = require('body-parser');
var {
  graphqlExpress,
  graphiqlExpress
} = require('apollo-server-express');
var Schema = require('./schema');

var app = express();
app.use('/graphql', bodyParser.json(), graphqlExpress({
  schema: Schema,
  tracing: true,
  debug: false
}));
*/
function makeServer(){
  // Create instance of server
  const server = new ApolloServer({
    'typeDefs': typeDefs,
    'resolvers': resolvers,
    dataSources: () => {
      return {
        loaders: createLoaders(),
        db: db
      }
    }
  });

  return server;
}

module.exports = {
  makeServer
}