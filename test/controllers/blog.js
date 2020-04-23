

const {compressStr} = require('../../string-utils.js');

function blog(req) {
    console.log("GET: /posts", req.params.id, req.query);
    let post1 = {
        title: "fdsfsdfsdf",
        content: "sdfsdfsdfsdf sdfsdf sdf sdf"
    };
    return post1;
}

function msgPack(req) {
    console.log("GET: /msgPack");
    let htmlStr = '<!doctype html>\n' +
        '<html  lang="">\n' +
        '<head>\n' +
        '  <meta charset="utf-8">\n' +
        '  <title></title>\n' +
        '  <meta name="description" content="">\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '</head>\n' +
        '\n' +
        '<body>\n' +
        '  <p>Hello world! This is HTML5 Boilerplate.</p>\n' +
        '</body>\n' +
        '</html>\n';

    let page1 = {
        title: "html",
        content: compressStr(htmlStr)
    };
    return page1;
}

const api = {
    posts: blog,
    msgPack
};
module.exports = api;