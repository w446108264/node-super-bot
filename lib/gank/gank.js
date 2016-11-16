let co = require('co');
var fs = require('fs');
let moment = require('moment');
let request = require("co-request");
let schedule = require('node-schedule');
let async = require('async');

let baseCore = require('core-base');
let log = baseCore.getLogger();

let wechatCore = require('core-wechat');
let wechatSender = wechatCore.getWechatSender();
let wechatUpload = wechatCore.getWechatUpload();
var slack = require('../slack/slack');

var gank = g_config.gank;

/**
 * a task that to get a image from gank bewteen 1 to 5 every week when the global gank config is not null~
 */
exports.startGankSchedule = function () {
    if (gank == null) {
        log.error("can't find gank config when startGankSchedule!");
        return;
    }

    if (gank.schedule_getimage_hour == null || gank.schedule_getimage_minute == null) {
        log.error("schedule_getimage_hour or schedule_getimage_minute can't be null!");
        return;
    }

    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [0, new schedule.Range(1, 7)];
    rule.hour = gank.schedule_getimage_hour;
    rule.minute = gank.schedule_getimage_minute;
    schedule.scheduleJob(rule, function () {
        exports.gankGiveMeFive();
    });
}

/**
 * get a last image url from gank
 * @returns {*} if success will return url, else will throw
 */
exports.getLastGankImageUrl = function *() {
    var options = {
        uri: 'http://gank.io/api/data/%E7%A6%8F%E5%88%A9/2/1',
        method: 'GET'
    };
    var response = yield request(options);
    try {
        if (response == null || response.body == null) {
            return null;
        }
        var json = JSON.parse(response.body);
        var resultsArray = json.results;
        return resultsArray[0].url;
    } catch (e) {
        throw e;
    }
};

/**
 * get a random image url from gank
 * @returns {*} if success will return url, else will throw
 */
exports.getRandomGankImageUrl = function *() {
    var options = {
        uri: 'http://gank.io/api/random/data/%E7%A6%8F%E5%88%A9/1',
        method: 'GET'
    };
    var response = yield request(options);
    try {
        if (response == null || response.body == null) {
            return null;
        }
        var json = JSON.parse(response.body);
        var resultsArray = json.results;
        return resultsArray[0].url;
    } catch (e) {
        throw e;
    }
};

/**
 * get gank image and push to wechat
 * @param wechatImageJson
 * @param isRandom isRandom true -> get random image false -> get today image
 */
exports.gankGiveMeFive = function (wechatImageJson, isRandom, callback) {

    if (gank == null) {
        log.error("can't find gank config when gankGiveMeFive!");
        return;
    }

    if (gank.file_save_path == null) {
        log.error("gank.file_save_path can't be null!");
        return;
    }

    var retry_rule = {
        interval: 1000,
        times: 5
    };

    async.auto({
        get_gank_imgae: async.retryable(retry_rule, function (cb) {
            co(isRandom ? exports.getRandomGankImageUrl() : exports.getLastGankImageUrl())
                .then(function (url) {
                    if (url == null) {
                        cb("url can't be null!");
                        return;
                    }
                    cb(null, url);
                });
        }),
        check_url:['get_gank_imgae', function (results, cb) {
            if(isRandom) {
                cb(null);
            } else {
                var url = results.get_gank_imgae;
                var downloadFilePath = gank.file_save_path + url.substring(url.lastIndexOf("/"), url.length);
                fs.stat(downloadFilePath, function (err, stat) {
                    if (stat && stat.isFile()) {
                        return cb("File already exists when get gank images with non-random");
                    } else {
                        cb(null);
                    }
                });
            }
        }],
        send_toslack: ['check_url', function (results, cb) {
            if (gank.slack == null) {
                return cb(null);
            }
            slack.postSlackImage(gank.slack.channel,
                gank.slack.icon_emoji,
                gank.slack.username,
                results.get_gank_imgae,
                function (error, response, body) {
                    return cb(error, results);
                });
        }],
        download_and_push: ['check_url', function (results, cb) {
            var wechat_config = gank.wechat;
            if (wechat_config == null) {
                return cb(null);
            }

            if (wechat_config.corpID == null || wechat_config.secret == null) {
                cb(null);
                log.error("wechat_config.corpID or wechat_config.secret can't be null!");
                return;
            }

            var opts = {
                auth: {
                    corpID: wechat_config.corpID,
                    secret: wechat_config.secret,
                    token: null
                },
                uri: "",
                type: "image",
                file_save_path: gank.file_save_path,
                file_name: null,
                retry_rule: retry_rule
            }

            opts.uri = results.get_gank_imgae;
            results.opts = opts;
            wechatUpload.autoDownloadAndPushToWechat(opts, function (err, results) {
                if (err != null) {
                    return cb(err);
                }
                if (err == null && results != null && results.media_id != null) {
                    cb(null, results.media_id);
                } else {
                    return cb("upload failure! ");
                }
            });
        }],
        send_towechat: ['download_and_push', function (results, cb) {
            /**
             * if wechatImageJson is null, will use the global config
             * @type {{touser: *, agentid: *, msgtype: string, image: {media_id: Array}, safe: string}}
             */
            var json = {
                "touser": wechatImageJson && wechatImageJson.touser ? wechatImageJson.touser : gank.wechat.gank_touser,
                "agentid": wechatImageJson && wechatImageJson.agentid ? wechatImageJson.agentid : gank.wechat.gank_agentid,
                "msgtype": "image",
                "image": {
                    "media_id": results.download_and_push
                },
                "safe": "0"
            }
            wechatSender.autoSend(json, results.opts, function (error, results) {
                cb(error, results);
            });
        }]
    }, function (error, results) {
        if (error != null) {
            log.error("gankGiveMeFive -> " + error);
        } else {
            log.info("gankGiveMeFive -> send success!" + results);
        }
        if(callback != null) {
            callback(error, results);
        }
    });
}