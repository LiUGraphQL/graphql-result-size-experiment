# Example GraphQL Server
Server using apollo-server-express, example schema to query over database.db.
The server uses an additional package to calculate the size of query response objects, which is available at [github:LiUGraphQL/graphql-result-size](https://github.com/LiUGraphQL/graphql-result-size).

## Deployment
```
git clone
cd graphql-server
npm install
```
The server is started with `node server.js`
Starting the server will host a GraphQL http endpoint on localhost:4000/graphql, and a GraphiQL interface on localhost:4000/graphiql.

The server can be tested in another instance of the command line.
`npm test -- -i 1 -q 1`
Will test query 1 for 1 iterations and put the test result in output.txt
Test queries are found in test/queries.js
