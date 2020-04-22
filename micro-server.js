const http = require('http') //supports https & http2 (unlike nanoexpress)
const { parse } = require('querystring')

const KoaRadixTreeRouter = require('koa-tree-router') //lru cache?

const msgpack = require('msgpack-lite');
const fastJson = require('fast-json-stringify')



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

//bluebird



function sanitizeUrl (url) {
  for (var i = 0, len = url.length; i < len; i++) {
    var charCode = url.charCodeAt(i)
    // Some systems do not follow RFC and separate the path and query
    // string with a `;` character (code 59), e.g. `/foo;jsessionid=123456`.
    // Thus, we need to split on `;` as well as `?` and `#`.
    if (charCode === 63 || charCode === 59 || charCode === 35) {
      return url.slice(0, i)
    }
  }
  return url
}

function lookup (req, res, defaultRoute) {
  const _router = router;

  const handle = function(req, res) {
    const { handle, params } = _router.find(req.method, this.sanitizeUrl(req.path));
    if (!handle) {
      if (defaultRoute !== null) {
        return defaultRoute(req, res)
      } else {
        res.statusCode = 404
        res.end()
        return ;
      }
    }

    //params.push({ key: n.path.slice(1), value: path.slice(0, end) });
    //    let _params = {}
//    params.forEach(({ key, value }) => { //array to obj
//      _params[key] = value;
//    });//
    try {
      return handle( req, res, params);
    } catch (err) {
   //   return errorHandler(err, req, res)
    }
  };
  return handle;
}



function cors (req, res, next) {
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

function urlInfo (req) {
  let url = req.url
  let obj = req._parsedUrl
  if (obj && obj._rawUrl === url) return obj
  obj = {}
  let idx = url.indexOf('?', 1)
  if (idx !== -1) {
    let query = url.substring(idx + 1)
    obj.query = query != null ? parse(query) : {}
    obj.path = url.substring(0, idx)
  }
  obj._rawUrl = url
  return (req._parsedUrl = obj)
}

function sendJson(res, data) {
  if (data == "error") {
    data = {
      error: data
    };
  }

  //schema
  const jsonResponse = JSON.stringify({
    data
  });

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(jsonResponse));

  res.statusCode = 200;
  res.end(jsonResponse, 'utf8');
};

function sendEmpty(res,code=200){
  res.statusCode = code;
  res.end();
}

function sendMsgPack(res, data) {
  const msgpackResponse = msgpack.encode({//faster binary communication
    data
  });
  res.writeHead(200, {
    'Content-Type': 'application/x-msgpack;', // application/vnd.msgpack , application/msgpack
    'Content-Length': msgpackResponse.length,
  });
  res.end(msgpackResponse);
};

function compressStr(result) {

  const hasResult = (result != null && result.length > 0);
  const Bytes = hasResult
    ? Buffer.from(result)
    : new Uint8Array(0);

  if (brotli == null) {
    brotli = require('brotli');
  }
  const data = {
    hasResult,
    Result: brotli.compress(Bytes) //x8 less size
  };
  return data;
};
//
// router.on('GET', '/posts', (req, res, params) => {
//
// })

module.exports = (config = {}) => {

  let _cfg = {
    allowCORS: true,
    parseJson: true,
    clustered: true,
    allowExtrernalCalls: true,
    port: 3000,
    isRespMsgPack:false, //json,
    defaultRoute:null //(req,res)=>{}
  }
  Object.assign(_cfg, config)

  const router = new KoaRadixTreeRouter()
  const mw = function (req, res, next) {
  if(_cfg.allowCORS)
    this.cors(req, res, next)

    urlInfo(req);
    if(_cfg.parseJson)
      req.body = JSON.parse(req.data);
  }
  const server = http.createServer(mw())

  server.on('request', (req, res) => {
    setImmediate(() => this.lookup(req, res, _cfg.defaultRoute));
  })

  const webHost = _cfg.allowExtrernalCalls ? '0.0.0.0' : '127.0.0.1';

  const _server ={
    listen: (port=3000)=>{
      console.log('listening on: ' + webHost + ':' + port + ' ...');
      server.on('error', function (e) {
        console.log(e);
      });

      server.listen(port, webHost);
    }
  }
  return {
    router,
    _server
  }
}
