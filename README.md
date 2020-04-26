# micro-server.js
fastest http(&amp; https/http2.0) server for node.js

supports clustering on many cores, 

and response of type: json , msgpack , brotli

#### uses koa-tree-router (radix tree) + [mnemonist/lru-cache] search for request,

#### uses bluebird promises for request dispatching,

####  , and fast-json-stringify [ajv schemas] for responses

uses fast zlib compression level
___

http server can be chosen: native node.js http class , or faster & slimmer low-level uWebSockets.js http server

[only for http1 , no compression support , not compatible with all node http class apis only some]

[for now ws-http mode is disabled , using uWebSockets as http server is not production ready, less stable]

___

micro-server.js is based on ideas from: 

0http / polkadot / zeit micro / nest js / restana / siffr / nanoexpress

to start using: 
clone into ./http folder of the using project:
```
git clone https://github.com/igal-abachi-dev/micro-server.js.git
```

main app.js:
```javascript
require('./http/clusterizer.js').startCluster(()=>{
    const {dtoSchemas} = require('./example.schemas.js');
    const {routes} = require('./example.routes.js');

    require('./http/micro-server.js')({
        allowCORS: true,
        https: {
           key: fs.readFileSync(__dirname + '/server.key'),
           cert:  fs.readFileSync(__dirname + '/server.crt')
         },
        http2: true,
    }).init(function (router, schemas) {
        dtoSchemas(schemas);
        routes(router);
    }).listen(3000);
});
```

routes:
```javascript
const api = {
    blog: {},
    users: {}
};
initApiControllers();

function routes(router) {
    router.get('/posts', (req) => {
        return {
            schema: 'post',
            data: api.blog.posts(req)
        };
    });
    router.get('/msgPack', (req) => {
        return {
            binary: true,
            data: api.blog.msgPack(req) //brotli compressed
        };
    });
    router.post('/user/:id', (req) => {
        api.users.updateUser(req); //write to db
    });
}

function initApiControllers(){
    try {
        api.blog = require('./controllers/blog.js');
    } catch (e) {
        console.error(e)
    }
    try {
        api.users = require('./controllers/users.js');
    } catch (e) {
        console.error(e)
    }
}

```

stringify ajv schemas:
```javascript
function blogController_Schemas(schemas) {

    schemas['post'] = {
        type: 'object',
        properties: {
            title: {
                type: 'string'
            },
            content: {
                type: 'string'
            }
        },
        required: ['title']
    };
    
    schemas['arr'] = {
  title: ' array',
  type: 'object',
  properties: {
    ids: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            a: {
              type: 'string'
            }
          }
        }
      ]
    }
  }
};

}

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
