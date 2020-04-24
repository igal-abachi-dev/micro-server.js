require('../clusterizer.js').startCluster(()=>{
    console.log("starting...");
    const {dtoSchemas} = require('./example.schemas.js');
    const {routes} = require('./example.routes.js');

    require('../micro-server.js')(/*ctx ,*/{
        allowCORS: true,
    }).init(function (router, schemas) {
        dtoSchemas(schemas);
        routes(router);
    }).listen(3000);
});


