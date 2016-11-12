var router = require('koa-router')();
let baseCore = require('core-base');
let log = baseCore.getLogger();

var rd = require('rd');

/**
 * 自助渠道包
 */
router.get('/', async function (ctx, next) {

    ctx.state = {
        title: '家的要素-Android 渠道包自助获取'
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
        var fileName = channelPaths[i].indexOf("/") >= 0
            ? channelPaths[i].substring(channelPaths[i].lastIndexOf("/"), channelPaths[i].length)
            : channelPaths[i];

        var channelFile = {
            name: fileName,
            path: channelPaths[i]
        };
        channelFiles.push(channelFile);
    }

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
    var txtChannel = ctx.body.txtChannel;

    /**
     * 校验渠道合法
     */

    /**
     * 生成渠道包
     */


    log.info(txtChannel);


    ctx.state = {
        title: txtChannel
    };

    await ctx.render('./jiayaosu/build.ejs', {});
})

module.exports = router;
