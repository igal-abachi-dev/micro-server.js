# micro-server.js
fastest http(&amp; https/http2.0) server for node.js

based on: 0http / polkadot / zeit micro / nest js

```javascript
let server = require('../micro-server.js')({
    allowCORS: true,
    clustered: true
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
    "chalk": "^4.0.0",
    "fast-json-stringify": "^2.0.0",
    "koa-tree-router": "^0.6.0",
    "lodash": "^4.17.15",
    "moment": "^2.24.0",
    "msgpack-lite": "^0.1.26",
    "nodemailer": "^6.4.6",
    "serve-static": "^1.14.1"
  }
```
