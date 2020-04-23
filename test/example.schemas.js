const {blogController_Schemas} = require('./models/blog.js');
//const {usersController_Schemas} = require('./models/users.js');

function dtoSchemas(schemas) {
    blogController_Schemas(schemas);
    // usersController_Schemas(schemas);
}

const api = {
    dtoSchemas
};
module.exports = api;