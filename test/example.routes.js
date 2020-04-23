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
            data: api.blog.msgPack(req) //compressed`
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

module.exports = {
    routes
};