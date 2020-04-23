const nodemailer = require("nodemailer");

function sendMail(sender = {
                      user: "fdsfsdfsdfsdf@yahoo.com",
                      pass: "45345fgdfgdfgdf435"
                  }, to = "",
                  subject = "mail",
                  msgText = "hello!",
                  server = {
                      host: "smtp.mail.yahoo.com",
                      port: 465,
                      secureConnection: true,
                      secure: true,
                      requiresAuth: true,
                  }) {
    const transporter = nodemailer.createTransport({
        host: server.host,
        port: server.port,
        secureConnection: server.secureConnection,
        secure: server.secure,
        requiresAuth: server.requiresAuth,
        auth: sender
    });

    let mailOptions = {
        from: sender.user,
        to: "dfsdfsdfsdf@gmail.com",
        subject: "mail",
        xMailer: "WebService/1.1.13212 YMailNorrin Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
        text: msgText,
        html: '<html><head></head><body><div style="font-family:Helvetica Neue, Helvetica, Arial, sans-serif;font-size:16px;">' + msgText + '</div></body></html>',
    };

    console.log("sending email...");
    transporter.sendMail(mailOptions).then(function (info) {
        console.log(JSON.stringify(info));
    });
}


module.exports = {sendMail};
