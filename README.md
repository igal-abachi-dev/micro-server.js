# micro-server.js
fastest http(&amp; https/http2.0) server for node.js

support clustering on many cores, 

and response: json , msgpack , brotli

uses koa-tree-router (radix tree) + [mnemonist/lru-cache] search for request,

uses bluebird promises for request dispatching,

 , and fast-json-stringify [ajv schemas] for responses



http server can be chosen: native node.js http class , or faster & slimmer low-level uWebSockets.js http server

[only for http1 , no compression support , not compatible with all node http class apis only some]

[for now ws-http mode is disabled , using uWebSockets as http server is not production ready, less stable]

micro-server.js is based on ideas from: 

0http / polkadot / zeit micro / nest js / restana / siffr / nanoexpress

```javascript
let server = require('./http/micro-server.js')({
    allowCORS: true,
    clustered: true, //use all cpu cores
    https: {
           key: fs.readFileSync(__dirname + '/server.key'),
           cert:  fs.readFileSync(__dirname + '/server.crt')
         },
        http2: true,
});

    server.then(function (initRouter) {
        const {dtoSchemas} = require('./example.schemas.js');
        const api = {
            blog: require('./controllers/blog.js'),
            users: require('./controllers/users.js')
        };

        function routes(router, schemas) {
            dtoSchemas(schemas);

            router.get('/posts', (req) => {
                return {
                    schema: 'post',
                    data: api.blog.posts(req)
                };
            });
            router.get('/msgPack', (req) => {
                return {
                    binary: true,
                    data: api.blog.page(req) //brotli compressed
                };
            });
            router.post('/user/:id', (req) => {
                api.users.updateUser(req); //write to db
            });
        }

        initRouter(routes).listen(3000);
    }).catch(function (e) {
        console.error(err);
    });
```


```javascript
 "dependencies": {
   "axios": "^0.19.2",
    "bluebird": "^3.7.2",
    "brotli": "^1.3.2",
    "chalk": "^4.0.0",
    "compression": "^1.7.4",
    "eventemitter3": "^4.0.0",
    "fast-json-stringify": "^2.0.0",
    "koa-tree-router": "^0.6.0",
    "lodash": "^4.17.15",
    "mnemonist": "^0.36.0",
    "moment": "^2.24.0",
    "msgpack-lite": "^0.1.26",
    "nodemailer": "^6.4.6",
    "serve-static": "^1.14.1",
    "uWebSockets.js": "github:uNetworking/uWebSockets.js#v17.3.0"
  }
```
