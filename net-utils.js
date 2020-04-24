const msgpack = require('msgpack-lite');

function sendJson(res, data, stringifyBySchema) {
    if (data == "error") {
        data = {
            error: data
        };
    }

//https://ajv.js.org/

//ajv json schema
// const stringify = fastJson({
//   type: 'object',
//   properties: {
//     firstName: {
//       type: 'string'
//     },
//     lastName: {
//       type: 'string'
//     },
//     age: {
//       type: 'integer'
//     },
//     reg: {
//       type: 'string'
//     }
//   }
//  required: ['firstName']
// })

    const jsonResponse = (stringifyBySchema != null)
        ? stringifyBySchema(data)
        : JSON.stringify(data);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));

    res.statusCode = 200;
    res.end(jsonResponse, 'utf8');
};

function sendEmpty(res, code = 200) {
    res.statusCode = code;
    res.end();
}

function sendMsgPack(res, result) {
    const msgpackResponse = msgpack.encode(//faster binary communication
        result.data
    );
    if (res.isHttpOverWS) {
        res.setHeader('Content-Type', 'application/x-msgpack');
        res.setHeader('Content-Length', msgpackResponse.length);
        res.statusCode = 200;
    } else {
        res.writeHead(200, {
            'Content-Type': 'application/x-msgpack', // application/vnd.msgpack , application/msgpack
            'Content-Length': msgpackResponse.length,
        });
    }
    res.end(msgpackResponse);
};

const api = {
    sendJson,
    sendEmpty,
    sendMsgPack
};
module.exports = api;