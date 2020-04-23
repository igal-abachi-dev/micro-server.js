const KoaRadixTreeRouter = require('koa-tree-router'); //x2 faster than find-my-way(which is x2 faster then trouter , 4x express)
const fastJson = require('fast-json-stringify');

const {Promise} = require("bluebird");

const {
    sendJson,
    sendEmpty,
    sendMsgPack
} = require('./net-utils.js');


const {sanitizeUrl} = require('./url-utils.js');


// mnemonist/lru-cache.js


const router = new KoaRadixTreeRouter();
let schemas = {};

function lookupRoute(req, res, defaultRoute, isRespMsgPack) {
    const _router = router;

//    runs after middleware finished

    const {handle, params} = _router.find(req.method, sanitizeUrl(req.path || req.url));
    //route handlers
    if (!handle) {
        //route search is case-sensitive!
        if (defaultRoute !== null) {
            return defaultRoute(req, res)
        } else {
            sendEmpty(res,404);
            return;
        }
    }

    //route params like /:id
    req.params = {};
    for (let i = 0; i < params.length; i++) {//kv array to obj map
        let p = params[i];
        req.params[p.key] = p.value;
    }

    //chainRequestHandlers(fnArray, req) //many handlers for same route?

    //bluebird promisify()?
    try {
        let result = null;
        if (handle.length > 0)
            result = handle[0](req); //call route handle of api

        //send result
        if (result == null) {
            sendEmpty(res);
        } else {
            if (isRespMsgPack || result.binary == true) {
                sendMsgPack(res, result);
            } else {
                sendJson(res, result.data, schemas[result.schema])
            }
        }
    } catch (err) {
        console.error(err);
        //   return errorHandler(err, req, res)
        /*{
        statusCode: 400,
        code: 'bad_request',
        message: 'Bad Request'
    }
        */
    }
}

function chainRequestHandlers(fnArray, req) {
    let index = -1;
    return dispatch(0);

    function dispatch(i) {
        if (i <= index)
            return Promise.reject(new Error('next() called multiple times'));
        index = i;
        let fn = fnArray[i];
        if (i === fnArray.length)
            fn = null;

        if (!fn) return Promise.resolve();
        try {
            return Promise.resolve(fn(req, dispatch.bind(null, i + 1)));
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

const api = {};
api.attachRouter = function (server, cfg) {
    //main request loop
    server.on('request', (req, res) => {
        setImmediate(() => lookupRoute(req, res, cfg.defaultRoute, cfg.isRespMsgPack));
    });



    //
    // exports.run = (req, res, fn) =>
    //     new Promise(resolve => resolve(fn(req, res)))
    //         .then(val => {
    //             if (val === null) {
    //                 send(res, 204, null);
    //                 return;
    //             }
    //             if (val !== undefined) {
    //                 send(res, res.statusCode || 200, val);
    //             }
    //         })
    //         .catch(err => sendError(req, res, err));

    return router;
};
api.initSchemas = function (dtoSchemas) {
    for (const schemaName in dtoSchemas) {
        schemas[schemaName] = fastJson(dtoSchemas[schemaName]);
    }
};
module.exports = api;