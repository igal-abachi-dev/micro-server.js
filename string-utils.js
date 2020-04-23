const {parse} = require('querystring');
let brotli;

//require('raw-body'); -> buffer ->string -> json

function parseBody(body, contentType) {
    if (body == null)
        return null;
    if (contentType === 'application/x-www-form-urlencoded') {
        //Form submit
        return parse(body, undefined, undefined, {maxKeys: 1000}); //parameterLimit
    } else if (contentType === 'application/json') {
        //ajax json
        return JSON.parse(body);
    } else {
        return body;
    }
};

function compressStr(str) {

    const hasResult = (str != null && str.length > 0);
    const Bytes = hasResult
        ? Buffer.from(str)
        : new Uint8Array(0);

    if (brotli == null) {
        brotli = require('brotli');
    }
    return hasResult == false ? str : brotli.compress(Bytes); //x8 less size
};

const api = {
    compressStr,
    parseBody
};
module.exports = api;