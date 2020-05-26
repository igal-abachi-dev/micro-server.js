const http = require('http') //supports https & http2 (unlike nanoexpress)


//const fs = require('fs');

//const serveStaticFolder = require('serve-static');
//var contentDisposition = require('content-disposition');//https://github.com/jshttp/content-disposition

//const {bench} = require('./bench.js');

const {attachRouter, initSchemas} = require('./routing.js');

const {urlInfo} = require('./url-utils.js');

const {parseBody} = require('./string-utils.js');

const {Promise} = require("bluebird");

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
        //if(config.useWsHttp1FastServer){
            /*fast low level http1 using micro web sockets , slim server doesn't have full capabilities like node's http*/
            //let uWSApp = require('./http1-over-ws');
            //server = uWSApp(mw);

            //disabled , experimental , less stable for production / clustering
            //can have errors on very high loads
       // }
       // else{
            server = http.createServer(mw);
            server.keepAliveTimeout = 5000;
        //}
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

function onParseBody(bodyText, req) {
    try {
        //[json / qs / text]
        req.body = parseBody(bodyText, req.headers['content-type']);
    } catch (err) {
        console.error(err,null);
        req.body = bodyText;
    }
}


//factory: server(ctx=module[ctrl,svc])
function initServer(config) {

    let compressionMw;
    if (config.compress && !config.isRespMsgPack) {
        compressionMw = compression({
            filter: function (req, res) {
                if (req.headers['x-no-compression']) {
                    // don't compress responses with this request header
                    return false
                }

                // fallback to standard filter function
                return compression.filter(req, res)
            },
            level: 1
        }) //zlib.Z_BEST_SPEED 1 instead of default 6 (& 9 is best compression but slowest)
    }

    //publicFolder = serveStaticPaths('public');
    const mw = function (req, res, next) {
        if (config.allowCORS)
            cors(req, res, next);

        urlInfo(req);

        //parse body:
        if (req.body == null && (req.method === "POST" || req.method === "PUT")) {
            let body = '';
            req.on('error', (err) => {
                console.error(err,null);
            }).on('data', (chunk) => {
                body += chunk.toString(); //no need to limit
            }).on('end', () => {
              //  setImmediate(()=>{
                    onParseBody(body,req);
              //  });

                //mmckelvy/parse-body npm
                // delvedor/fast-json-body
                //raw-body / co-body

            });

            /*
             let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
        console.log(body);
        res.end('ok');
    });
            */
        }

        if (compressionMw != null && !req.isHttpOverWS && !req.headers['x-no-compression']) {
            compressionMw(req, res, () => {
            }); //zopfli? brotli?
        }

        //publicFolder(req, res, finalhandler(req, res));
        // https://github.com/pillarjs/finalhandler
    }

    const server = chooseServerType(config, mw);
    const router = attachRouter(server, config);

    const webHost = config.allowExtrernalCalls ? '0.0.0.0' : '127.0.0.1';
    const _server = {
        listen: (port = 3000, afterListen) => {
            console.log('listening on: ' + webHost + ':' + port + ' ...');
            server.on('error', function (e) {
                //'EADDRINUSE'
                console.log(e);
                //	process.exit(1);
            });

            server.listen(port, webHost,()=>{
                if(afterListen != null){
                    afterListen();
                }
            });
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

    const _init = (cb) => {
        if (cb) {
            /* http.METHODS.map(m=>m.toLowerCase())*/
            let schemas = {};
            //routes are case-sensitive!
            cb(router, schemas);
            initSchemas(schemas);
            return _server;//fluent:   initRouter(router=>{}).listen(3000);
        }
    };
    return _init;
}

//https://swagger.io/
//"swagger-ui-dist": "^3.23.6"

//passport

module.exports = (config = {}) => {
    //load from file? 'config.json'
    let _cfg = {
        allowCORS: true,
        https: null,
        // {
        //   key: fs.readFileSync(__dirname + '/server.key'),
        //   cert:  fs.readFileSync(__dirname + '/server.crt')
        // },
        http2: false,//must beused with  https to use in browser , unsecured http2 only for micro-services
        parseJson: true,
        compress: true, //if not msgPack[strings compressed with brotli]
        useWsHttp1FastServer: true, //experimental
        allowExtrernalCalls: true,
        isRespMsgPack: false, // or json response,
        defaultRoute: null //handler(req,res)=>{}
    }
    Object.assign(_cfg, config);
    //        initPromise = startCluster(initServer)(_cfg);

    return {
        //routes are case-sensitive!
        init: initServer(_cfg)
    };
}
