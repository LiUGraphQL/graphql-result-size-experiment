const { rawRequest } = require('graphql-request');
const waitOn = require('wait-on');
const { calculateResultSize } = require('../test/utils.js')
const url = 'http://localhost:4000/graphql';
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const { mean } = require('lodash');
let data = {};

function writeExperimentHeader(path){
    const header = "Directory,Query,Time,Size,Threshold,Query calculator,Terminate early,Warmup,Status,Timestamp";
    if(!fs.existsSync(path)){
        fs.closeSync(fs.openSync(path, 'w'));
    }
    
    if(fs.readFileSync(path, {encoding:'utf8', flag:'r'}).length == 0){
        write(header);
    }
}

function write(string){
    console.log(string);
    fs.appendFileSync("results.csv", string + "\n");
}

function writeResult(directory,queryFile, time, size, useQueryCalculator, threshold, terminateEarly, warmup, status){
    let row = directory + ',';
    row += queryFile + ',';
    row += time + ',';
    row += size + ',';
    row += threshold + ',';
    row += useQueryCalculator + ',';
    row += terminateEarly + ',';
    row += warmup + ',';
    row += status + ',';
    row += new Date().getTime();
    write(row);
}

function runQuery(query){
    const t0 = new Date();
    return rawRequest(url, query)
        .then(({ data, extensions }) => {
            const time = new Date() - t0;
            let size;
            if(extensions == undefined){
                size = calculateResultSize(data);
            } else {
                size = extensions.calculate.resultSize;
            }
            return { size, time, status: "ok" };
        })
        .catch(e => {
            const time = new Date() - t0;
            let size = e["response"]["errors"][0]["extensions"]["resultSize"];
            return { size, time, status: e["response"]["errors"][0]["extensions"]["code"] };
        });
}

async function run(queryDir, useQueryCalculator, threshold, terminateEarly, warmup){
    for(const queryFile of fs.readdirSync(queryDir)){
        if(!queryFile.endsWith(".graphql")){
            continue;
        }
        const q = fs.readFileSync(queryDir + queryFile, {encoding:'utf8', flag:'r'});
        const { size, time, status } =  await runQuery(q);
        writeResult(queryDir, queryFile, time, size, useQueryCalculator, threshold, terminateEarly, warmup, status);
    }
}

function main(){
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
            await run(argv.queryDir, argv.useQueryCalculator, argv.threshold, argv.terminateEarly, warmup);
        }
    });
}

main()
