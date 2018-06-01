var fs = require('fs');
var {
  rawRequest
} = require('graphql-request');
const args = require('minimist')(process.argv.slice(2));
const queries = require('./queries');
var _ = require('lodash');

const sendRequest = (iter, query) => {
  return rawRequest('http://localhost:4000/graphql', query).then(({
    data,
    extensions
  }) => {
    totalCalc += extensions.tracing.calculation.duration;
    totalExec += extensions.tracing.execution.duration;
    if (--iter > 0)
      return sendRequest(iter, query);
  });
};

const execute = (iter, q) => {
  return sendRequest(i, q[iter]).then(() => {
    console.log('Query ' + iter + ' executed');
    logger.write(iter + '			|	' + totalCalc / i + '	|	' + totalExec / i + '\n');
    if (++iter < _.size(q)) {
      totalCalc = 0;
      totalExec = 0;
      return execute(iter, q);
    }
  });
};

const setupWriteStream = (file, i) => {
  var logger = fs.createWriteStream(file, {
    flags: 'a'
  });
  logger.on('error', function(err) {
    console.error(err);
  });
  logger.on('open', () => {
    console.log('Starting tests with ' + i + ' iterations.');
  });
  logger.on('finish', () => {
    console.log('Tests completed, output available in output.txt.');
  });
  return logger;
};

if (!(typeof args.i === 'number' && typeof args.q === 'number')) {
  console.error('Missing or wrong type for argument, please provide a number of iterations to be run!');
  console.error('Usage: "node logger.js -i iterations"');
} else {
  var i = args.i;
  var q = args.q;
  var logger = setupWriteStream('output.txt', i);
  var totalCalc = 0;
  var totalExec = 0;
  logger.write(
    'TEST RESULT FOR FILE: queries.js\nAVERAGE TIMES IN NS\n================================\nQuery	|	Calculation	|	Execution\n'
  );

  execute(0, queries['queries'+q]).then(() => {
    logger.write('================================\n');
    logger.end();
  });
}
