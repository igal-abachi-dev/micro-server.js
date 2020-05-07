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
           key: fs.readFileSync(__dirname + '/server.key'), //or use nginx reverse proxy below...
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
    blog: loadCtrl('blog'),
    users: loadCtrl('users')
};

function routes(router) {
    router.get('/posts', (req) => {
        return {
            schema: 'post', //schema is optional , on api that needs faster stringify
            data: api.blog.posts(req)
        };
    });
    router.get('/msgPack', (req) => {
        return {
            binary: true,
            data: api.blog.msgPack(req) //brotli compressed
        };
    });
    
    //return delayed result from callback instead of immediate result from return val;\
    router.get('/api/ntp2', (req, send) => {
        api.time.ntp(function (result) {
            send({
                schema: 'ntp',
                data: result || {}
            });
        }, 0);
    });
    
    router.post('/user/:id', (req) => {
        api.users.updateUser(req); //write to db
    });
}


function loadCtrl(ctrl) {
    try {
        return require('./controllers/' + ctrl + '.js');
    } catch (e) {
        console.error(e);
        return {};
    }
}


```

stringify ajv schemas: (can return null schema if you want to use the slower JSON.stringify)
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
};

}

```

to use with nginx reverse proxy: (so https will use same web site cert of let's encrypt):
instead of using https inside node itself
```javascript
	location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Fowarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Fowarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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


todo: error handling  , move js to typesciprt...

finalhandler , firebase
