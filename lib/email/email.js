/**
 * email
 * @see https://github.com/nodemailer/nodemailer
 */
var nodemailer = require('nodemailer');

/**
 * send emial.
 * @param fromOptions {@code {
              "service": "qqex",
              "port": 465,
              "secureConnection": true,
              "auth": {
                  "user": "xxx@xxx.com",
                  "pass": "xxx"
              }
 }}
 * @param mailOptions {@code {
        from: "xxx@xxx.com",
        to: "xxx@xxx.com,xxx@xxx.com,xxx@xxx.com",
        subject: "subject",
        text: "text"
    }}
 * @param callback
 * @see https://github.com/nodemailer/nodemailer
 */
exports.sendMail = async function (fromOptions, mailOptions, callback) {
    var _nodemailer = nodemailer.createTransport(fromOptions);
    await  _nodemailer.sendMail(mailOptions).then(function (results) {
        callback(null, results);
    }).catch(function (err) {
        callback(err);
    });
}

/**
 * parse to user array to string and spit with ","
 * @param toList
 * @returns {string} return to user string like "a,b,c"
 */
exports.parseToArray = function (toList) {
    var toStr = "";
    if (toList == null) {
        return toStr;
    }
    for (var i = 0; i < toList.length; i++) {
        if (typeof toList[i] == "string") {
            if (i != 0) {
                toStr += ",";
            }
            toStr = toStr + toList[i];
        }
    }
    return toStr;
}