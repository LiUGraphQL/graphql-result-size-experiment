# Example GraphQL Server
This repo contains everything related to the concrete SQLite-based GraphQL implementation with result size calculation that Andreas Lundquist has used for his experiments, as documented in his Master's thesis titled [Combining Result Size Estimation and Query Execution for the GraphQL Query Language](http://urn.kb.se/resolve?urn=urn%3Anbn%3Ase%3Aliu%3Adiva-167086).

*Note: If you are here to find the implementation that Tim Andersson has used for his Bachelor thesis ([Result size calculation for Facebook's GraphQL query language](http://urn.kb.se/resolve?urn=urn:nbn:se:liu:diva-150026)), switch to the [TimAndersson branch](https://github.com/LiUGraphQL/graphql-result-size-experiment/tree/TimAndersson).*

The GraphQL server is implemented using apollo-server-express and it provides access via SQLite to the [relational database representation](http://wifo5-03.informatik.uni-mannheim.de/bizer/berlinsparqlbenchmark/spec/Dataset/index.html#relationalrepresentation) of a [BSBM](http://wifo5-03.informatik.uni-mannheim.de/bizer/berlinsparqlbenchmark/) dataset. This database is available in the file `database.db`.
The server uses an additional package to calculate the size of query response objects, which is available at github: [LiUGraphQL/graphql-result-size](https://github.com/LiUGraphQL/graphql-result-size).
Moreover, the server uses i) an [extended version of graphql-extensions](https://github.com/LiUGraphQL/graphql-extensions), ii) an [extended version of apollo-tracing-js](https://github.com/LiUGraphQL/apollo-tracing-js), and iii) an [extended version of apollo-server-core](https://github.com/LiUGraphQL/apollo-server-core).

## Deployment
```
git clone
cd graphql-result-size-experiment
npm ci
```
Note that the test server needs to be deployed with `npm ci` rather than `npm install`. This is necessary to make sure that the deployment uses the package versions specified in `package-lock.json` (namely, our [extended version of graphql-extensions](https://github.com/LiUGraphQL/graphql-extensions), our [extended version of apollo-tracing-js](https://github.com/LiUGraphQL/apollo-tracing-js), and our [extended version of apollo-server-core](https://github.com/LiUGraphQL/apollo-server-core)).

The server is started with
```
node server.js
```
Starting the server will host a GraphQL http endpoint on http://localhost:4000/graphql, and a GraphiQL interface on http://localhost:4000/graphiql.

## Running the experiments
After starting the server in one terminal, the experiment can be run from a client-side perspective by executing commands such as the following in another terminal.
```
npm test -- -i 1 -q 1
```
This particular command will execute test query 1 for 1 iterations, and the test results will be written into the file `output.txt`. The test queries are available in the file `test/queries.js`.
