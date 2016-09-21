var router = require('koa-router')();

var _email = require('../../lib/email/email')

let baseCore = require('core-base');
let log = baseCore.getLogger();

/**
 * a api to ask server send a email.
 * @example post data to http://127.0.0.1:80/email/send"
 * <p>HTTP -> POST   Content-Type -> application/json request data {@code {
          to": [
              "xxx@qq.com"
          ],
          "from": {
              "service": "qqex",
              "port": 465,
              "secureConnection": true,
              "auth": {
                  "user": "xxx@xxx.com",
                  "pass": "xxx"
              }
          },
          "data": {
              "subject": "title",
              "text": "content"
           }
 }}
 */
router.post('/send', async function (ctx, next) {
    try {
        var body = ctx.body;
        var sendData = JSON.stringify(body);
    } catch (e) {
        log.error(e);
        ctx.body = e;
        return;
    }

    if (body.from == null || body.from.auth == null || body.from.auth.user == null) {
        log.error("can't find from user!");
        ctx.body = "can't find from user!";
        return;
    }

    if (body.to == null) {
        log.error("can't find to user!");
        ctx.body = "can't find to user!";
        return;
    }

    if (body.data == null || body.data.text == null) {
        log.error("can't find data!");
        ctx.body = "can't find data!";
        return;
    }

    var mailOptions = {
        from: body.from.auth.user,
        to: _email.parseToArray(body.to),
        subject: body.data.subject,
        text: body.data.text
    };

    await _email.sendMail(body.from, mailOptions, function (error, results) {
        if (error) {
            log.error(error + "  send email -> " + sendData);
            ctx.body = error;
            return;
        }
        log.info("send email -> " + sendData);
        ctx.body = "ok";
    });
});

module.exports = router;
