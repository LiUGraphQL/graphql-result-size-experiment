const { rawRequest } = require('graphql-request');
const waitOn = require('wait-on');
const { calculateResultSize } = require('../test/utils.js')
const url = 'http://localhost:4000/graphql';
const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');

function writeExperimentHeader(path){
    const header = "Directory,Query,Time,Size,Threshold,Query_Calculator,Terminate_early,Warmup,Status,Pending_Promize_Time,Timestamp";
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

function writeResult(outputFile, directory,queryFile, time, size, useQueryCalculator, threshold, terminateEarly, warmup, status, pendingPromizeTime){
    let row = directory + ',';
    row += queryFile + ',';
    row += time + ',';
    row += size + ',';
    row += threshold + ',';
    row += useQueryCalculator + ',';
    row += terminateEarly + ',';
    row += warmup + ',';
    row += status + ',';
    row += pendingPromizeTime + ',';
    row += new Date().getTime();
    write(outputFile, row);
}

async function runQuery(query){
    const t0 = new Date();
    return rawRequest(url, query)
        .then(({ data, extensions }) => {
            const time = new Date() - t0;
            let size;
            let pendingPromizeTime;
            if(extensions == undefined){
                size = calculateResultSize(data);
                pendingPromizeTime = 0;
            } else {
                size = extensions.calculate.resultSize;
                pendingPromizeTime = extensions.calculate.pendingPromizeTime;
            }
            return { size, time, status: "ok", pendingPromizeTime };
        })
        .catch(e => {
            const time = new Date() - t0;
            let size = e["response"]["errors"][0]["extensions"]["resultSize"];
            let pendingPromizeTime = e["response"]["errors"][0]["extensions"]["pendingPromizeTime"];
            let status = e["response"]["errors"][0]["extensions"]["code"];
            return { size, time, status, pendingPromizeTime };
        });
}

async function run(outputFile, queryDir, useQueryCalculator, threshold, terminateEarly, warmup){
    for(const queryFile of fs.readdirSync(queryDir)){
        if(!queryFile.endsWith(".graphql")){
            continue;
        }
        const q = fs.readFileSync(queryDir + queryFile, {encoding:'utf8', flag:'r'});
        const { size, time, status, pendingPromizeTime } =  await runQuery(q);
        writeResult(outputFile, queryDir, queryFile, time, size, useQueryCalculator, threshold, terminateEarly, warmup, status, pendingPromizeTime);
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
            await run(argv.outputFile, argv.queryDir, argv.useQueryCalculator, argv.threshold, argv.terminateEarly, warmup);
        }
    });
}

main()
