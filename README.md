# Example GraphQL Server
Server using apollo-server-express, example schema to query over database.db.
The server uses a query calculation package available at github:timandersson/graphql-query-calculator.

## Deployment
```
git clone
cd graphql-server
npm install
```
The server is started with `node server.js`
Starting the server will host a GraphQL http endpoint on localhost:4000/graphql, and a GraphiQL interface on localhost:4000/graphiql.
