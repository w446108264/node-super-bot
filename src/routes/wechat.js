let co = require('co');
var router = require('koa-router')();
var urlencode = require('urlencode');
var getRawBody = require('raw-body');
var typer = require('media-typer');
var x2j = require('xml2js');

let baseCore = require('core-base');
let log = baseCore.getLogger();

var nodeWeixinCrypto = require('node-weixin-crypto');
var nodeWeixinMessage = require('node-weixin-message');
var messages = nodeWeixinMessage.messages;
var wechat_config = g_config.common_wechat;

var rec_event = require('../../lib/wechat/rec_event').rec_event;
var rec_msg = require('../../lib/wechat/rec_msg').rec_msg;

var callbackCheckConfig = {
    id: wechat_config.corpID,
    encodingAESKey: wechat_config.encodingAESKey,
    token: wechat_config.token
};

/**
 * 验证开启回调模式
 * @see http://qydev.weixin.qq.com/wiki/index.php?title=%E5%9B%9E%E8%B0%83%E6%A8%A1%E5%BC%8F
 */
router.get('/hi', function (ctx, next) {
    if(wechat_config == null) {
        ctx.body = "server can't init common_wechat without config!";
        return;
    }

    var msg_signature = ctx.query.msg_signature;
    var timestamp = ctx.query.timestamp;
    var nonce = ctx.query.nonce;
    var echostr = ctx.query.echostr;
    var encrypted = nodeWeixinCrypto.decrypt(urlencode.decode(echostr, 'utf-8'), callbackCheckConfig);
    ctx.body = encrypted;
});

/**
 * 回调模式 消息分发入口
 * @see http://qydev.weixin.qq.com/wiki/index.php?title=%E6%8E%A5%E6%94%B6%E4%BA%8B%E4%BB%B6
 */
router.post('/hi', async function (ctx, next) {
    if(wechat_config == null) {
        ctx.body = "server can't init common_wechat without config!";
        return;
    }

    await co(exports.getRaw(ctx))
        .then(function (raw) {
            exports.xmlParse(raw, ctx.req, function (error, results) {
                if (error) {
                    ctx.body = error;
                } else {
                    ctx.body = "ok";
                }
            });
        });
});

/**
 * parse -> decrypt -> deliver
 * @param xml
 * @param req
 * @param cb
 */
exports.xmlParse = function (xml, req, cb) {

    // I'm test data
    // xml = "<xml><ToUserName><![CDATA[toUser]]></ToUserName><Encrypt>OuNcGohZgD8y9y70RlXcoPQNblb40chj6bbagCoGa7z7g/qVEhMvdj3d4rkjKcRWeN+YawtrNVCaTBKcOyq57uAQrtrrt7FJp2kQlxneXp4ZTrla8aIAClRIpOQLmq5aoGiCVq9PsALpE70M/SOOjhxlwvKW2YcFjCjEdfuLWGwsJ1zaGBOeAy/pfDwM6xYKYnQ2UFLvsgfoOiRikwuQ5eYsiW5/v6p3mOwc7CCSah7gjV3Z37zU2oFifwJ8Ji50Dletq44tWuFIvShG+e5n1l3yeqsWaHcSYgLavawI0loOJL+vqc1cZRymM9sTN3anvI+OJH09NQeQJLZif/rKAgtnZPaKCNx79Zk29PVBRwTm2YAdfkTTzOd3uq0mP0GtOuZ96swXWs5bFehLbN58yIiwmoaZFrw86m1r/MIUpbiPAEdDLQFzjZe0Mj64CxFIp+8p5ibDfzk3f4rzA08idw==</Encrypt><AgentID>1</AgentID></xml>"


    if(xml == null) {
        log.error("xml can't be null!");
        cb("xml can't be null!");
        return;
    }

    var self = messages;
    var preArg = arguments;

    /**
     * parse
     */
    x2j.parseString(xml, {
        explicitArray: false,
        ignoreAttrs: true
    }, function (error, json) {
        if (error) {
            log.error(error + "  json:" + json);
            cb(error);
            return;
        }
        log.info(json);

        /**
         * decrypt
         */
        var encrypt = json.xml.Encrypt;
        if(encrypt == null) {
            log.error("encrypt can't be null!");
            cb("encrypt can't be null!");
            return;
        }
        var encrypted = nodeWeixinCrypto.decrypt(encrypt, callbackCheckConfig);

        /**
         * parse again
         */
        x2j.parseString(encrypted, {
            explicitArray: false,
            ignoreAttrs: true
        }, function (error, json) {
            if (error) {
                log.error(error + "  json:" + json);
                cb(error);
                return;
            }
            log.info(json);

            var args = [json.xml];
            for (var i = 1; i < preArg.length; i++) {
                args.push(preArg[i]);
            }

            /**
             * deliver
             */
            new rec_event().register(messages);
            new rec_msg().register(messages);
            self.parse.apply(self, args);
        });
    });
};

/**
 * raw -> xml
 * @param ctx
 * @returns {*}
 */
exports.getRaw = function *(ctx) {
    if(ctx.body != null){
        return ctx.body;
    }
    return yield getRawBody(ctx.req, {
        length: ctx.length,
        limit: '1mb',
        encoding: ctx.charset
    });
};

module.exports = router;
