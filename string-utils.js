const {parse} = require('querystring');
//require('raw-body'); -> buffer ->string -> json

function parseBody(body , parseJson=true) {
    if (parseJson) {
        //ajax json
        return JSON.parse(body);
    }
    else{
        //Form submit
        return parse(body, undefined, undefined, { maxKeys: 1000 }); //parameterLimit
    }
};


const api = {
    parseBody
};
module.exports = api;