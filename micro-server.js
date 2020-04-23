const http = require('http') //supports https & http2 (unlike nanoexpress)


//const fs = require('fs');

//const serveStaticFolder = require('serve-static');
//var contentDisposition = require('content-disposition');//https://github.com/jshttp/content-disposition

//const {bench} = require('./bench.js');

const {attachRouter, initSchemas} = require('./routing.js');

const {urlInfo} = require('./url-utils.js');

const {parseBody} = require('./string-utils.js');

const {Promise} = require("bluebird");

const {startCluster} = require('./clusterizer.js');

const _ = require('lodash');

const compression = require('compression');

const warning = (message) => chalk`{yellow WARNING:} ${message}`;
const info = (message) => chalk`{magenta INFO:} ${message}`;
const error = (message) => chalk`{red ERROR:} ${message}`;

//const readFile = Promise.promisify(fs.readFile);
//const compressionHandler = Promise.promisify(compression());


function serveStaticPaths(path) {
    // Serve up public/ftp folder
    return serveStaticFolder(path.join(__dirname, path), {
        'index': false,
        'setHeaders': (res, path) => {
            res.setHeader('Content-Disposition', contentDisposition(path))
        }
    });
}

function cors(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Request-Method', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, MERGE, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    res.setHeader('Access-Control-Allow-Credentials', true)
    //
    // if (req.method === "OPTIONS") {
    //   res.writeHead(200);
    //   res.end();
    //   return;
    // }
    // next();
}


function chooseServerType(config, mw) {
    let server;
    if (config.https != null) {
        if (config.http2 == true) {
            //res.setHeader('Content-Type', 'text/html');

            server = require('http2').createSecureServer({
                key: config.https.key,
                cert: config.https.cert,
                allowHTTP1: true //compatibility
            }, mw);
        } else {
            server = require('https').createServer(options.https, mw);
            server.keepAliveTimeout = 5000;
        }
    } else if (config.http2 == true) {
        server = require('http2').createServer(mw);
        //unsecured http2
        server.on('session', function (session) {
            session.setTimeout(5000, session.close)
        })
    } else {
        //require('0http/lib/server/low') / nanoexpress?
        server = http.createServer(mw);
        server.keepAliveTimeout = 5000;
    }
    return server;
}

function close(httpServer) {
    if (!httpServer) {
        return undefined;
    }
    return new Promise(resolve => httpServer.close(resolve));
}

const registerShutdown = (fn) => {
    let run = false;

    const wrapper = () => {
        if (!run) {
            run = true;
            fn();
        }
    };

    process.on('SIGINT', wrapper);
    process.on('SIGTERM', wrapper);
    process.on('exit', wrapper);
};

//factory: server(ctx=module[ctrl,svc])
function initServer(config) {
    //publicFolder = serveStaticPaths('public');
    const mw = function (req, res, next) {
        if (config.allowCORS)
            this.cors(req, res, next)

        urlInfo(req);

        req.body = parseBody(req.data, config.parseJson);
        //
        // if (compress) {
        //     await compressionHandler(request, response);
        // }


        //publicFolder(req, res, finalhandler(req, res));
        // https://github.com/pillarjs/finalhandler
    }

    const server = chooseServerType(config, mw);
    const router = attachRouter(server, config);

    const webHost = config.allowExtrernalCalls ? '0.0.0.0' : '127.0.0.1';
    const _server = {
        listen: (port = 3000) => {
            console.log('listening on: ' + webHost + ':' + port + ' ...');
            server.on('error', function (e) {
                //'EADDRINUSE'
                console.log(e);
                //	process.exit(1);
            });

            server.listen(port, webHost);
        }
    }

    //
    // registerShutdown(() => {
    //     console.log(`\n${info('Gracefully shutting down. Please wait...')}`);
    //
    //     process.on('SIGINT', () => {
    //         console.log(`\n${warning('Force-closing all open sockets...')}`);
    //         process.exit(0);
    //     });
    // });

    const _initRouter = (cb) => {
        if (cb) {
            /* http.METHODS.map(m=>m.toLowerCase())*/
            let schemas = {};
            cb(router, schemas);
            initSchemas(schemas);
            return _server;//fluent:   initRouter(router=>{}).listen(3000);
        }
    };
    return _initRouter;
}

//https://swagger.io/

module.exports = (config = {}) => {
    //load from file? 'config.json'
    let _cfg = {
        allowCORS: true,
        https: null,
        // {
        //   key: fs.readFileSync(__dirname + '/server.key'),
        //   cert:  fs.readFileSync(__dirname + '/server.crt')
        // },
        http2: false,//must be https to use in browser , unsecured http2 only for micro-services
        parseJson: true,
        clustered: true,
        allowExtrernalCalls: true,
        isRespMsgPack: false, // or json response,
        defaultRoute: null //handler(req,res)=>{}
    }
    Object.assign(_cfg, config);
    let initPromise;

    //clustering...
    if (_cfg.clustered) {
        initPromise = startCluster(initServer)(_cfg);
    } else {
        initPromise = Promise.promisify(initServer)(_cfg);
    }
    return initPromise.then(function (routerCb) {
        return {
            initRouter: routerCb
        }
    });
}
