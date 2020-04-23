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
}

const api = {
    blogController_Schemas
};
module.exports = api;