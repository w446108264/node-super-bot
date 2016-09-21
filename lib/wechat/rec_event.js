/**
 * Created by sj on 9/5/16.
 */
let baseCore = require('core-base');
let log = baseCore.getLogger();
var gank = require('../../lib/gank/gank');

var rec_event = function () {

    this.register = function (messages) {

        //处理用户订阅
        messages.event.on.subscribe(function (message, res, cb) {
            cb();
        });

        //处理用户退订
        messages.event.on.unsubscribe(function (message, res, cb) {
            cb();
        });

        //处理扫描带参数二维码事件
        messages.event.on.scan(function (message, res, cb) {
            cb();
        });

        //处理上报地理位置事件
        messages.event.on.location(function (message, res, cb) {
            cb();
        });

        //处理点击菜单拉取消息时的事件
        messages.event.on.click(function (message, res, cb) {
            if (message.EventKey == "get_gank_random") {
                gank.gankGiveMeFive({ "touser": message.FromUserName, "agentid": message.AgentID}, true, function (error, results) {
                    cb();
                });
            }
        });

        //处理点击菜单跳转链接时的事件
        messages.event.on.view(function (message, res, cb) {
            cb();
        });

        //处理模块消息发送事件
        messages.event.on.templatesendjobfinish(function (message, res, cb) {
            cb();
        });
    }
};

exports.rec_event = rec_event;