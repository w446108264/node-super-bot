var router = require('koa-router')();

let baseCore = require('core-base');
let log = baseCore.getLogger();

var pretty = require('prettysize');
var rd = require('rd');
var fs = require('fs');
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
     * 过滤版本文件 jiayaosu-1.0-dev-preview-2016111209
     */
    for (var i = 0; i < files.length; i++) {
        var fileName = files[i].indexOf("/") >= 0
            ? files[i].substring(files[i].lastIndexOf("/"), files[i].length)
            : files[i];

        if (fileName.indexOf("-") >= 0) {
            var tempSpit = fileName.split("-");
            if (tempSpit != null && tempSpit.length > 1 && tempSpit[1].indexOf(".") > 0) {
                var target = {
                    name: fileName,
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
    var v = ctx.query.v;

    var channelFiles = [];

    var channelPaths = rd.readFileFilterSync(process.cwd() + '/output/' + v, /\.apk$/);
    /**
     * 过滤版本文件 jiayaosu-1.0-dev-preview-2016111209
     */
    for (var i = 0; i < channelPaths.length; i++) {
        exports.getInfo(channelPaths[i], channelFiles,v);
    }

    await ctx.render('./jiayaosu/item_filelist.ejs', {
        "channelFiles": channelFiles
    });
})


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
        log.info(channelPaths);
        var channelFile = {
            name: fileName,
            url: "http://139.224.73.230/android/repository/jiayaosu/" + v + fileName,
            size: pretty(stats.size),
            date: exports.formatTime(stats.mtime)
        };
        log.info(channelFile.name);
        channelFiles.push(channelFile);

    })


}


/**
 * 补增渠道
 */
router.post('/', async function (ctx, next) {

    /**
     * 获取渠道
     */
    var txtChannel = ctx.body.channel;
    var txtAuth = ctx.body.auth;

    /**
     * 校验渠道
     */
    if(!exports.checkChannel(txtChannel)) {
        ctx.body = {
            error: "请输入合法渠道!"
        }
        return;
    }

    /**
     * 校验授权码
     */
    if("jiayaosu" != txtAuth.trim()) {
        ctx.body = {
            error: "请输入正确的授权码!"
        }
        return;
    }

    /**
     * 生成渠道包
     */
    var channels = txtChannel.split("\n");
    log.info("xx:" + channels.length + "  " +txtChannel);
    for(var i = 0 ; i < channels.length ;i ++) {
        var channel = channels[i].trim();
    }

    fs.writeFile('input.txt', '我是通过写入的文件内容！',  function(err) {
        if (err) {
            return console.error(err);
        }
        console.log("数据写入成功！");
        console.log("--------我是分割线-------------")
        console.log("读取写入的数据！");
        fs.readFile('input.txt', function (err, data) {
            if (err) {
                return console.error(err);
            }
            console.log("异步读取文件数据: " + data.toString());
        });
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
    if(txtChannel == null || txtChannel == "") {
        return false;
    }
    return true;
}

module.exports = router;
