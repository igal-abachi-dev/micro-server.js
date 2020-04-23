# micro-server.js
fastest http(&amp; https/http2.0) server for node.js

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
