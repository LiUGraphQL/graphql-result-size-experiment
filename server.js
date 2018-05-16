var express = require('express');
var bodyParser = require('body-parser');
var {
  graphqlExpress,
  graphiqlExpress
} = require('apollo-server-express');
var Schema = require('./schema');
var sqlite = require('sqlite');

sqlite.open('./database.db', {Promise})
  .then(() => {
    var app = express();
    app.use('/graphql', bodyParser.json(), graphqlExpress({
      schema: Schema,
      context: {
        db: {
          get: (...args) => sqlite.get(...args),
          all: (...args) => sqlite.all(...args)
        }
      },
      tracing: true
    }));
    app.get('/graphiql', graphiqlExpress({
      endpointURL: '/graphql'
    }));
    app.listen(4000);
    console.log('Running a GraphQL API server at localhost:4000/graphql');
  })
  .catch(e => console.log(e));
