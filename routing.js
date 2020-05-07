const KoaRadixTreeRouter = require('koa-tree-router'); //x2 faster than find-my-way(which is x2 faster then trouter , 4x express)
const fastJson = require('fast-json-stringify');

const {Promise} = require("bluebird");

const {
    sendJson,
    sendEmpty,
    sendMsgPack
} = require('./net-utils.js');


const {sanitizeUrl} = require('./url-utils.js');

const LRUCache = require('mnemonist/lru-cache');

const voidResultsAreDelayed = true;//default return null treated as __delayed = true , response

// mnemonist/lru-cache.js

const cache = new LRUCache(1000);

const router = new KoaRadixTreeRouter();
let schemas = {};

function lookupRoute(req, res, defaultRoute, isRespMsgPack) {
    const _router = router;

//    runs after middleware finished


    let handle_;
    let params_;
    const urlPath = sanitizeUrl(req.path || req.url);
    //cache routes
    const reqCacheKey = `${req.method + urlPath}`
    let match = cache.get(reqCacheKey);
    if (!match) {
        const {handle, params} = _router.find(req.method, urlPath);
        cache.set(reqCacheKey, {handle, params});
        handle_ = handle;
        params_ = params;
    } else {
        handle_ = match.handle;
        params_ = match.params;
    }
    //route handlers
    if (!handle_) {
		console.log("route not found: "+urlPath);
        //route search is case-sensitive!
        if (defaultRoute !== null) {
            return defaultRoute(req, res)
        } else {
            sendEmpty(res, 404);
            return;
        }
    }

    //route params like /:id
    req.params = {};
    for (let i = 0; i < params_.length; i++) {//kv array to obj map
        let p = params_[i];
        req.params[p.key] = p.value;
    }

    //chainRequestHandlers(fnArray, req) //many handlers for same route?

    let onSend = function (result) {
        try {
            if (result == null) {
                sendEmpty(res);
            } else {
                if (isRespMsgPack || result.binary == true) {
                    sendMsgPack(res, result);
                } else {
                    let schema = null;
                    if (result.schema != null) {
                        let schemaFn = schemas[result.schema];
                        schema = (data) => {
                            try {
                                return schemaFn(data);//faster
                            } catch {
                                //schema failed... (required field?)
                                return JSON.stringify(data);//slower
                            }
                        };
                    }
                    sendJson(res, result.data, schema)
                }
            }
        }catch (e) {
            //response was already sent?
            console.log(e);
        }
    };

    try {
        new Promise((resolve, reject) => { //free networking for more requests
            let result = null;
            if (handle_.length > 0)
                try {
                    result = handle_[0](req, onSend); //main Call route handler of the API
                } catch (err) {
                    reject(err);
                    return null;
                }
            return resolve(result);
        }).then(result => {
            //send result
            if ((result == null && voidResultsAreDelayed == false) || !result.__delayed) //if delayed , onSend() called from  callback
                onSend(result);

        }).catch(err => console.error(err, null));
    } catch (err) {
        console.error(err, null);
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
    if (server)
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