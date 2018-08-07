# Example GraphQL Server
This repo contains the everything related to the concrete SQLite-based GraphQL implementation with result size calculation that Tim has used for his experiments.

The GraphQL server is implemented using apollo-server-express and it provides access via SQLite to the [relational database representation](http://wifo5-03.informatik.uni-mannheim.de/bizer/berlinsparqlbenchmark/spec/Dataset/index.html#relationalrepresentation) of a [BSBM](http://wifo5-03.informatik.uni-mannheim.de/bizer/berlinsparqlbenchmark/) dataset. This database is available in the file `database.db`.
The server uses an additional package to calculate the size of query response objects, which is available at [github:LiUGraphQL/graphql-result-size](https://github.com/LiUGraphQL/graphql-result-size).

## Deployment
```
git clone
cd experiment-tim
npm install
```
The server is started with `node server.js`
Starting the server will host a GraphQL http endpoint on localhost:4000/graphql, and a GraphiQL interface on localhost:4000/graphiql.

## Running the experiments
After starting the server in one terminal, the experiment can be run from a client-side perspective by executing commands such as the following in another terminal.
```
npm test -- -i 1 -q 1
```
This particular command will execute test query 1 for 1 iterations, and the test results will be written into the file `output.txt`. The test queries are available in the file `test/queries.js`.
