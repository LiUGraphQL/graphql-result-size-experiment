import { rawRequest } from 'graphql-request';
import waitOn from 'wait-on';
import { calculateResultSize } from '../test/utils.js';
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));
import fs from 'fs';
const url = 'http://localhost:4000/graphql';

function writeExperimentHeader(path){
    const fields = [
        'queryDir', 'queryFile', 'warmup',
        'cacheHits', 'threshold',
        'resultSize', 'resultSizeLimit',
        'terminateEarly', 'timeout',
        'calculationTime', 'resultTime',
        'responseTime', 'waitingOnPromises',
        'errorCode', 'useQueryCalculator'
    ];
    if(!fs.existsSync(path)){
        fs.closeSync(fs.openSync(path, 'w'));
    }
    if(fs.readFileSync(path, {encoding:'utf8', flag:'r'}).length == 0){
        write(path, fields.join(','));
    }
}

function write(outputFile, string){
    console.log(string);
    fs.appendFileSync(outputFile, string + '\n');
}

function writeResult(outputFile, result){
    const fields = [
        'queryDir', 'queryFile', 'warmup',
        'cacheHits', 'threshold',
        'resultSize', 'resultSizeLimit',
        'terminateEarly', 'timeout',
        'calculationTime', 'resultTime',
        'responseTime', 'waitingOnPromises',
        'errorCode', 'useQueryCalculator'
    ];
    let row = [];
    for(let field of fields){
        if(result[field] === undefined){
            row.push('NA');
        } else {
            row.push(result[field]);
        }
    }
    write(outputFile, row.join(','));
}

async function runQuery(query){
    const start = performance.now();
    return rawRequest(url, query)
        .then(({ data, extensions }) => {
            if(extensions == undefined){
                const response = {};
                response.resultSize = calculateResultSize(data);
                response.responseTime = performance.now() - start;
                return response;
            } else {
                const response = extensions.response;
                response.responseTime = performance.now() - start;
                return response;
            }
        })
        .catch(e => {
            let response = {};
            if(e['response'] && e['response']['errors']){
                response = e['response']['errors'][0]['extensions']['code'];
            }
            response.responseTime = performance.now() - start;
            return response;
        });
}

async function run(outputFile, queryDir, warmup, useQueryCalculator){
    for(const queryFile of fs.readdirSync(queryDir)){
        if(!queryFile.endsWith('.graphql')){
            continue;
        }
        const q = fs.readFileSync(queryDir + queryFile, {encoding:'utf8', flag:'r'});
        const response =  await runQuery(q);

        writeResult(outputFile, { ...{ 'queryDir': queryDir, 'queryFile': queryFile, warmup, useQueryCalculator }, ...response });
        //await sleep(500);
    }
}

async function main(){
    console.info(`Waiting for server to become available at ${url}`);
    let urlGet = url.replace(/^http(s?)(.+$)/, 'http$1-get$2');
    const opts = {
        resources: [urlGet + '?query={__typename}'],
        delay: 2000, // initial delay in ms
        interval: 1000, // poll interval in ms
        followRedirect: true
    };

    waitOn(opts, async err => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        writeExperimentHeader(argv.outputFile);
        for(let i=0; i < argv.iterations + argv.warmups; i++){
            const warmup = i < argv.warmups;
            await run(argv.outputFile, argv.queryDir, warmup, argv.useQueryCalculator);
        }
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

main()
