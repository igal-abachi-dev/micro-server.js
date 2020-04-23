const KoaRadixTreeRouter = require('koa-tree-router'); //x2 faster than find-my-way(which is x2 faster then trouter , 4x express)
const fastJson = require('fast-json-stringify');

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

    const handle = function (req, res) {
        const {handle, params} = _router.find(req.method, sanitizeUrl(req.path));
        if (!handle) {
            if (defaultRoute !== null) {
                return defaultRoute(req, res)
            } else {
                sendEmpty(404);
                return;
            }
        }

        let _params = {};
        for (let i = 0; i < params.length; i++) {//kv array to obj map
            let p = params[i];
            _params[p.key] = p.value;
        }
        req.params = _params;

        //bluebird promisify()?
        try {
            let result = handle(req);
            if (result == null) {
                sendEmpty(res);
            } else {
                if (isRespMsgPack || result.binary == true) {
                    sendMsgPack(res, result);
                } else {
                    sendJson(res, schemas[result.schema], result.data)
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
    };
    return handle;
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