const cluster = require('cluster');
const numCPUs = require('os').cpus().length * 2;//phys+HT


const {Promise} = require("bluebird");


//winston logger


function sigQuitHandler(isMaster, worker) {
    //in case of hang

    if (isMaster) {
        process.once('SIGQUIT', function () {
            try {
                console.log("Passing SIGQUIT to" + worker.pid);
                worker.kill("SIGQUIT");

                console.log("closing Worker-Channel in Master");
                worker._channel.close();
                worker._channel.unref();
            } catch (e) {
                console.log(e);
            }
        });
    } else {
        process.once('SIGQUIT', function () {
            console.log('closing master-channel in Child');
            process._channel.close();
            process._channel.unref();

            require('fs').close(0);
        });
    }
}

function startCluster(startServerRoutine) {
    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running...`);
        cluster.schedulingPolicy = cluster.SCHED_NONE; // windows: SCHED_NONE , linux: SCHED_RR  !!!

        for (let i = 0; i < numCPUs; i++) {
            const worker = cluster.fork();
            sigQuitHandler(true, worker);
        }

        //cluster.on('online', function (worker) {
        //    console.log(`worker ${worker.process.pid} online`);
        //});

        cluster.on('exit', function (worker, code, signal) {
            console.log(`worker ${worker.process.pid} closed`);
            //var worker = cluster.fork(); //endless loop on ctrl+c
        });
        return null;
    } else {
        console.log(` Worker ${process.pid} started`);
        sigQuitHandler(false);

        try {
           // let serverFactory = Promise.promisify(startServerRoutine);
            //return serverFactory;

            startServerRoutine();
        } catch (err) {
            console.error(err);
        }
    }
}

const api = {
    startCluster
};
module.exports = api;