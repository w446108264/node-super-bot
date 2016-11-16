var router = require('koa-router')();
let baseCore = require('core-base');
var fileUtil = baseCore.getFileUtil();
let log = baseCore.getLogger();

var pretty = require('prettysize');
var rd = require('rd');
var fs = require('fs');
let async = require('async');

var exec = require('child_process').exec;
var toolPath = process.cwd() + '/tool/PackerNg-1.0.7-Exhanced.jar';

/**
 * 自助渠道包
 */
router.get('/', async function (ctx, next) {

    ctx.state = {
        title: '家的要素-Android 渠道包自助😁'
    };

    var targets = [];

    /**
     * 获取源程序目录下所有文件
     */
    var files = rd.readFileFilterSync(process.cwd() + '/sourceApk', /\.apk$/);

    /**
     * 过滤版本文件 jiayaosu-1.0-dev-preview-2016111209.apk
     */
    for (var i = 0; i < files.length; i++) {
        var fileName = files[i].indexOf("/") >= 0
            ? files[i].substring(files[i].lastIndexOf("/"), files[i].length)
            : files[i];

        if (fileName.indexOf("-") >= 0) {
            var tempSpit = fileName.split("-");
            if (tempSpit != null && tempSpit.length > 1 && tempSpit[1].indexOf(".") > 0) {
                var target = {
                    fileName: fileName,
                    version: tempSpit[1]
                };
                targets.push(target);
            }
        }
    }

    /**
     * 获取当前版本已经存在的channel
     */
    await ctx.render('./jiayaosu/build.ejs', {
        "targets": targets
    });
})

/**
 * 获取当前版本相关信息和渠道列表
 */
router.get('/filelist', async function (ctx, next) {
    var version = ctx.query.v;

    var channelFiles = [];

    var path = process.cwd() + '/output/' + version;

    await async.auto({
        make_folder: function (cb) {
            fileUtil.mkdirs(path, function (err) {
                if(err) {
                    return cb(err);
                }
                cb(null);
            });
        }
    }, function (error, results) {
        var channelPaths = rd.readFileFilterSync(path, /\.apk$/);
        /**
         * 过滤版本文件 jiayaosu-1.0-dev-preview-2016111209
         */
        for (var i = 0; i < channelPaths.length; i++) {
            exports.getInfo(channelPaths[i], channelFiles, version);
        }
    });
    await ctx.render('./jiayaosu/item_filelist.ejs', {
        "channelFiles": channelFiles
    });
})

/**
 * 补增渠道
 */
router.post('/', async function (ctx, next) {

    /**
     * 获取渠道
     */
    var txtChannel = ctx.body.channel;
    var txtAuth = ctx.body.auth;
    var version = ctx.body.version;
    var apkFileName = ctx.body.apkFileName;

    /**
     * 校验渠道
     */
    if (!exports.checkChannel(txtChannel)) {
        ctx.body = {
            error: "请输入合法渠道!"
        }
        return;
    }

    /**
     * 校验授权码
     */
    if ("jiayaosu" != txtAuth.trim()) {
        ctx.body = {
            error: "请输入正确的授权码!"
        }
        return;
    }
    var sourceApkPath = process.cwd() + "/sourceApk" + apkFileName;

    await async.auto({
        checkSourceApk: function (cb) {
            /**
             * 校验源Apk 是否存在
             */
            fs.stat(sourceApkPath, function (err, stat) {
                if (stat && stat.isFile()) {
                    cb(null);
                } else {
                    return cb("目标版本不存在!");
                }
            });
        },
        make_folder: ['checkSourceApk', function (results, cb) {
            var output = process.cwd() + '/output/' + version + "/";
            fileUtil.mkdirs(output, function (err) {
                if (err != null) {
                    return cb(err);
                }
                cb(null, output);
            });
        }],
        exec: ['make_folder', function (results, cb) {
            // 过滤换行
            txtChannel = txtChannel.replace(/<br>/g, " ");
            // 过滤#
            txtChannel = txtChannel.replace(/#[^\s*]*\s*/g, "");

            /**
             * shell 命令循环生成Apk
             * @type {string}
             */
            var cmdStr = 'java -jar ' + toolPath + ' ' + sourceApkPath + ' ' + results.make_folder + ' -c ' + txtChannel;
            exec(cmdStr, function (err, stdout, stderr) {
                if (stdout.indexOf("Success") > 0) {
                    cb(null);
                } else {
                    return cb("生成补增渠道包失败,请联系管理员!");
                }
            });
        }]
    }, function (error, results) {
        if (error) {
            ctx.body = {
                error: error
            }
            log.error("补增渠道 -> " + error);
        } else {
            ctx.body = {
                version: version
            }
            log.info("补增渠道 -> send success!");
        }
    });
})

/**
 * 格式化文件时间
 * @param time
 * @returns {string}
 */
exports.formatTime = function (time) {
    var date = new Date(time)
    return date.getFullYear()
        + "-" + date.getMonth()
        + "-" + date.getDay()
        + " " + date.getHours()
        + ":" + date.getMinutes();
}

/**
 * 校验渠道合法
 * @param txtChannel
 * @returns {string}
 */
exports.checkChannel = function (txtChannel) {
    if (txtChannel == null || txtChannel == "") {
        return false;
    }
    return true;
}

/**
 * 获取文件详细信息
 * @param channelPaths
 * @param channelFiles
 * @param v
 */
exports.getInfo = async function (channelPaths, channelFiles, v) {
    var fileName = channelPaths.indexOf("/") >= 0
        ? channelPaths.substring(channelPaths.lastIndexOf("/"), channelPaths.length)
        : channelPaths;

    /**
     * {@code { dev: 16777220,
             mode: 33188,
             nlink: 1,
             uid: 501,
             gid: 20,
             rdev: 0,
             blksize: 4096,
             ino: 78808297,
             size: 244,
             blocks: 8,
             atime: Wed May 27 2015 18:24:43 GMT+0800 (CST),
             mtime: Wed May 27 2015 18:26:25 GMT+0800 (CST),
             ctime: Wed May 27 2015 18:26:25 GMT+0800 (CST) }}
     */
    fs.stat(channelPaths, function (err, stats) {
        var channelFile = {
            name: fileName,
            url: "http://139.224.73.230/android/repository/jiayaosu/" + v + fileName,
            size: pretty(stats.size),
            date: exports.formatTime(stats.mtime)
        };
        channelFiles.push(channelFile);
    })
}

module.exports = router;
