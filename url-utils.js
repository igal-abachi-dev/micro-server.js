const {parse} = require('querystring');

function urlInfo(req) {
    let url = req.url;
    let obj = req._parsedUrl;
    if (obj && obj._rawUrl === url) return obj;
    obj = {};
    let idx = url.indexOf('?', 1)
    if (idx !== -1) {
        let query = url.substring(idx + 1);
        req.query = (obj.query = query != null ? parse(query) : {});
        req.path = (obj.path = url.substring(0, idx));
    }
    obj._rawUrl = url;
    return (req._parsedUrl = obj);
}

function sanitizeUrl(url) {
    for (let i = 0, len = url.length; i < len; i++) {
        let charCode = url.charCodeAt(i);
        //  split on `;` as well as `?` and `#`.
        if (charCode === 63 || charCode === 59 || charCode === 35) {
            return url.slice(0, i);
        }
    }
    return url;
}


const api = {
    urlInfo,
    sanitizeUrl
};
module.exports = api;