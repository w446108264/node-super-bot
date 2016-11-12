let co = require('co');
var router = require('koa-router')();

let baseCore = require('core-base');
let log = baseCore.getLogger();

let wechatCore = require('core-wechat');
let wechatSender = wechatCore.getWechatSender();
var pgyer = require('../../lib/pgyer/pgyer');
var _email = require('../../lib/email/email');
var slack = require('../../lib/slack/slack');

var pgyer_config = g_config.pgyer;

/**
 * a webhook about pgyer.
 * <p>please set your hook on your pgyer app wehhook setting. {@link https://www.pgyer.com/doc/view/webhook_introduction}.
 * and then it will push notifications when the version update.
 * the last, don't forget add pgyer config on the global config file like {@link node-super-bot/config/default.json}
 * @example http://127.0.0.1:80/version/update?appid=cc.xx.app
 * <p>HTTP -> POST   Content-Type -> application/json  return {@code {
    "action": "应用更新",
    "title": "OooPlay",
    "link": "https://www.pgyer.com/oooplay_test",
    "message": "您的应用OooPlay有了新的版本(2.4)更新。",
    "type": "updateVersion",
    "os_version": "2.4",
    "build_version": "139",
    "created": "2015-10-09 11:25:16",
    "updated": "2015-10-09 11:25:16",
    "timestamp": 1444361118,
    "appsize": "2238036",
    "device_type": 'iOS',
    "notes": "修复了一些小弱智的小bug"
}}
 *
 */
router.post('/update', async function (ctx, next) {
    var appid = ctx.query.appid;
    if (appid == null) {
        ctx.state = {
            message: "appid can't be null!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    }

    if (pgyer_config == null) {
        ctx.state = {
            message: "server can't init pgyer without config!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    }

    var matchapp_config;
    if (pgyer_config.app != null) {
        for (var i = 0; i < pgyer_config.app.length; ++i) {
            if (appid == pgyer_config.app[i].appid) {
                matchapp_config = pgyer_config.app[i];
                break;
            }
        }
    }

    if (matchapp_config == null) {
        ctx.state = {
            message: "can't match appid!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    }

    var body = ctx.request.fields;

    /**
     * notify with wechat
     */
    if (matchapp_config.wechat) {
        pushUpdateToWechat(matchapp_config, body);
    }

    /**
     * notify with email
     */
    if (matchapp_config.email) {
        pushUpdateToEmail(matchapp_config, body);
    }

    /**
     * notify with slack
     */
    if (matchapp_config.slack) {
        pushUpdateToSlack(matchapp_config, body);
    }

    ctx.body = "ok";
});

/**
 * push update info to wechat when pgyer.[matchapp].wechat config like {@link node-super-bot/config/default.json} is not null!
 * @param matchapp_config  a config object which match appid.
 * @param body the request from pgyer
 * @returns {null}
 */
function pushUpdateToWechat(matchapp_config, body) {
    if (matchapp_config == null || matchapp_config.wechat == null || body == null) {
        return;
    }

    var json = {
        "touser": matchapp_config.wechat.update_touser,
        "msgtype": "news",
        "agentid": matchapp_config.wechat.update_agentid,
        "news": {
            "articles": [
                {
                    "title": matchapp_config.wechat.update_title + "\n" + body.os_version,
                    "description": body.updated,
                    "url": body.link,
                    "picurl": getRandomPicurl()
                },
                {
                    "title": body.notes,
                    "description": "detail",
                    "url": body.appQRCodeURL,
                    "picurl": body.appQRCodeURL
                }
            ]
        }
    };
    var opts2 = {
        auth: {
            corpID: matchapp_config.wechat.corpID,
            secret: matchapp_config.wechat.secret
        }
    }
    wechatSender.autoSend(json, opts2, function (err, results) {
        if (err != null) {
            log.error("pushUpdateToWechat -> " + err);
        } else {
            log.info("pushUpdateToWechat -> send success!" + results);
        }
    });
}

/**
 * push update info to email when pgyer.[matchapp].email config like {@link node-super-bot/config/default.json} is not null!
 * @param matchapp_config a config object which match appid.
 * @param body the request from pgyer
 * @returns {null}
 */
function pushUpdateToEmail(matchapp_config, body) {

    if (matchapp_config.email == null || matchapp_config.email.data == null
        || matchapp_config.email.from == null || matchapp_config.email.from.auth == null) {
        return null;
    }

    var emailContent = matchapp_config.email.data.text + matchapp_config.email.data.subject + body.os_version
        + "\n" + body.link
        + "\n" + body.notes
        + "\n" + body.updated;

    var mailOptions = {
        from: matchapp_config.email.from.auth.user,
        to: _email.parseToArray(matchapp_config.email.to),
        subject: matchapp_config.email.data.subject + body.os_version,
        text: emailContent
    };

    _email.sendMail(matchapp_config.email.from, mailOptions, function (error, results) {
        if (error) {
            log.error(error + "  send email -> " + sendData);
            ctx.body = error;
            return;
        }
        log.info("send email -> " + sendData);
        ctx.body = "ok";
    });
}

/**
 * push update info to slack when pgyer.[matchapp].slack config like {@link node-super-bot/config/default.json} is not null!
 * @param matchapp_config a config object which match appid.
 * @param body the request from pgyer
 * @returns {null}
 */
function pushUpdateToSlack(matchapp_config, body) {

    if (matchapp_config.slack == null) {
        return null;
    }

    var slackJson = {
        "icon_emoji": matchapp_config.slack.icon_emoji,
        "username": matchapp_config.slack.username,
        "attachments": [
            {
                "fallback": "",
                "color": "#36a64f",
                "pretext": matchapp_config.slack.pretext + "*`" + body.os_version + "`",
                "author_name": "",
                "author_link": "",
                "author_icon": "",
                "title": "",
                "title_link": "",
                "text": body.notes + "\n<" + body.link + ">\n",
                "image_url": body.appQRCodeURL,
                "thumb_url": body.appQRCodeURL,
                "footer": matchapp_config.slack.footer,
                "footer_icon": matchapp_config.slack.footer_icon,
                "ts": body.timestamp,
                "mrkdwn_in": ["text", "pretext"]
            }
        ]
    }

    slack.postSlack(matchapp_config.slack.channel, slackJson, function (error, response, body) {

    });
}

/**
 * get the build history from pgyer with appid. you will get a web page.
 * @see https://www.pgyer.com/doc/api#builds
 * @example http://127.0.0.1:80/version/build?appid=cc.xx.app
 */
router.get('/build', async function (ctx, next) {


    if (appid == null) {
        ctx.state = {
            message: "appid can't be null!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    }

    if (pgyer_config == null) {
        ctx.state = {
            message: "server can't init pgyer without config!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    }

    var matchapp_config;
    if (pgyer_config.app != null) {
        for (var i = 0; i < pgyer_config.app.length; ++i) {
            if (appid == pgyer_config.app[i].appid) {
                matchapp_config = pgyer_config.app[i];
                break;
            }
        }
    }

    if (matchapp_config == null) {
        ctx.state = {
            message: "can't match appid!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    }

    var options = {
        aId: matchapp_config.aId,
        _api_key: matchapp_config._api_key
    }

    await co(pgyer.getPgyerHistroy(options)).then(async function (response) {
        if (response.statusCode == 200) {
            var body = JSON.parse(response.body);
            if (body.message) {
                ctx.state = {
                    message: body.message,
                    error: {}
                };
                await ctx.render('error', {});
                return;
            } else {
                var title;
                var datas = body.data;
                datas.reverse();
                for (var i = datas.length - 1; i >= 0; i--) {
                    datas[i].appFileSize = bytesToSize(datas[i].appFileSize);
                    if (datas[i].appUpdateDescription != null && datas[i].appUpdateDescription != "" && datas[i].appUpdateDescription != "\n") {
                        datas[i].appUpdateDescription = "<li style = \"margin:2px\">" + datas[i].appUpdateDescription.replace(/\n/ig, "<li style = \"margin:2px\">");
                    }
                    if (title == null) {
                        title = datas[i].appName;
                    }
                }
                await ctx.render("./version/history.ejs", {
                    "name": title,
                    "url": matchapp_config.url_main,
                    "image": matchapp_config.url_image_qc,
                    "layout": false,
                    "historydescs": datas
                });
                return;
            }
        }

        ctx.state = {
            message: "unkonwn error!",
            error: {}
        };
        await ctx.render('error', {});
        return;
    });
})

function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1000, // or 1024
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

function getRandomPicurl() {
    return "https://unsplash.it/600/300/?random&diffcode=" + Date.parse(new Date());
}

module.exports = router;
