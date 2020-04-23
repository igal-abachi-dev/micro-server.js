const {setUserData} = require('../services/db.js');

const {sendMail} = require('../../mail-sender.js');

function updateUser(req) {
    console.log("POST: /user", req.body);
    setUserData(req.body);

    // sendMail( {
    //         user: "fdsfsdfsdfsdf@yahoo.com",
    //         pass: "45345fgdfgdfgdf435"
    //     },
    //     "jdhfksjdhf@hdkfjhg.com",
    //     "mail",
    //     "hello!",
    //     {
    //         host: "smtp.mail.yahoo.com",
    //         port: 465,
    //         secureConnection: true,
    //         secure: true,
    //         requiresAuth: true,
    //     });
}

const api = {
    updateUser,
};
module.exports = api;