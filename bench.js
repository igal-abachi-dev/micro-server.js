
const operations = 1000000;

function now () {
    var ts = process.hrtime()
    return (ts[0] * 1e3) + (ts[1] / 1e6);
}

function getOpsSec (ms) {
    return Number(((operations * 1000) / ms).toFixed());
}

const api = {};
api.bench = function(op,ops = operations){
    time = now();
    for (i = 0; i < ops; i++) {
        op();
    }
    return  getOpsSec(now() - time);
}
module.exports = api;