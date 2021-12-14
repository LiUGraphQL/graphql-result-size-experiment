const { rawRequest } = require('graphql-request');
const waitOn = require('wait-on');
const { calculateResultSize } = require('../test/utils.js')
const url = 'http://localhost:4000/graphql';
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');

function writeExperimentHeader(path){
    const header = "Directory,Query,Time,Size,Threshold,Terminate_early,Warmup,Status,Waiting_On_Promises,Cache_Hits,Timestamp";
    if(!fs.existsSync(path)){
        fs.closeSync(fs.openSync(path, 'w'));
    }
    if(fs.readFileSync(path, {encoding:'utf8', flag:'r'}).length == 0){
        write(path, header);
    }
}

function write(outputFile, string){
    console.log(string);
    fs.appendFileSync(outputFile, string + "\n");
}

function writeResult(outputFile, directory,queryFile, time, size, threshold, terminateEarly, warmup, status, waitingOnPromises, cacheHits){
    let row = directory + ',';
    row += queryFile + ',';
    row += time + ',';
    row += size + ',';
    row += threshold + ',';
    row += terminateEarly + ',';
    row += warmup + ',';
    row += status + ',';
    row += waitingOnPromises + ',';
    row += cacheHits + ',';
    row += new Date().getTime();
    write(outputFile, row);
}

async function runQuery(query){
    const start = performance.now();
    return rawRequest(url, query)
        .then(({ data, extensions }) => {
            const time = performance.now() - start;
            let size;
            let waitingOnPromises;
            if(extensions == undefined){
                size = calculateResultSize(data);
                waitingOnPromises = 0;
                cacheHits = -1;
            } else {
                size = extensions.calculate.resultSize;
                waitingOnPromises = extensions.calculate.waitingOnPromises || 0;
                cacheHits = extensions.calculate.cacheHits;
            }
            return { size, time, status: "ok", waitingOnPromises, cacheHits };
        })
        .catch(e => {
            const time = performance.now() - start;
            let size = e["response"]["errors"][0]["extensions"]["resultSize"];
            let waitingOnPromises = e["response"]["errors"][0]["extensions"]["waitingOnPromises"]  || 0;
            let cacheHits = e["response"]["errors"][0]["extensions"]["cacheHits"];
            let status = e["response"]["errors"][0]["extensions"]["code"];
            return { size, time, status, waitingOnPromises, cacheHits };
        });
}

async function run(outputFile, queryDir, threshold, terminateEarly, warmup){
    for(const queryFile of fs.readdirSync(queryDir)){
        if(!queryFile.endsWith(".graphql")){
            continue;
        }
        const q = fs.readFileSync(queryDir + queryFile, {encoding:'utf8', flag:'r'});
        const { size, time, status, waitingOnPromises, cacheHits } =  await runQuery(q);
        writeResult(outputFile, queryDir, queryFile, time, size, threshold, terminateEarly, warmup, status, waitingOnPromises, cacheHits);
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
            await run(argv.outputFile, argv.queryDir, argv.threshold, argv.terminateEarly, warmup);
        }
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

main()
