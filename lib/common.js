/**
 * Created by sj on 9/1/16.
 */
let baseCore = require('core-base');
let log = baseCore.getLogger();


let email = require('../lib/email/email');

let wechatCore = require('core-wechat');
let wechatSender = wechatCore.getWechatSender();
var common_wechat = g_config.common_wechat;
/**
 * notify wechat dev channal
 * @param msg
 */
exports.notifyWechatDev = function (msg) {
    if (msg == null) {
        log.error("msg can't be null!");
        return;
    }

    if (common_wechat == null) {
        log.error("common_wechat config can't be null!");
        return;
    }

    var json = {
        "touser": common_wechat.touser,
        "msgtype": "news",
        "agentid": common_wechat.agentid_dev,
        "msgtype": "text",
        "text": {
            "content": msg
        },
        "safe": "0"
    }
    var opts2 = {
        auth: {
            corpID: common_wechat.corpID,
            secret: common_wechat.secret,
            token: null
        }
    }
    wechatSender.autoSend(json, opts2, function (err, result) {
        if (err != null) {
            log.error("notifyWechatDev -> " + err);
        } else {
            log.info("notifyWechatDev -> send success!" + msg);
        }
    });
}

exports.notifyEmail = function (title, msg) {

    if (g_config.common_email == null) {
        log.error("common_email config can't be null!");
        return;
    }

    var fromOptions = {
        "service": "qqex",
        "port": 465,
        "secureConnection": true,
        "auth": {
            "user": "xxx@xxx.com",
            "pass": "xxx"
        }
    }

    var mailOptions = {
        from: g_config.common_email.from.auth.user,
        to: email.parseToArray(g_config.common_email.to),
        subject: title,
        text: msg
    }

    email.sendMail(g_config.common_email.from, mailOptions, function (err, result) {
        if (err != null) {
            log.error("notifyEmailDev -> " + err);
        } else {
            log.info("notifyEmailDev -> send success!" + msg);
        }
    });
}
