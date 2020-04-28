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
  tracing: true
}));
app.get('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}));
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');
