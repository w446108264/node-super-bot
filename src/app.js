const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const views = require('koa-views');
const co = require('co');
const convert = require('koa-convert');
const onerror = require('koa-onerror');
var body = require('koa-better-body')
const logger = require('koa-logger');

const index = require('./routes/index');
const wechat = require('./routes/wechat');
const email = require('./routes/email');
const version = require('./routes/version');
const jiayaosu = require('./routes/jiayaosu');

let baseCore = require('core-base');
let log = baseCore.getLogger();

import path from 'path'

app.use(convert(body()));
app.use(convert(logger()));
app.use(convert(require('koa-static')(__dirname + '/public')));

app.use(views(path.join(__dirname, '../views-ejs'), {
    extension: 'ejs'
}));

app.use(async(ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    log.info(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

router.use('/', index.routes(), index.allowedMethods());
router.use('/wechat', wechat.routes(), wechat.allowedMethods());
router.use('/email', email.routes(), email.allowedMethods());
router.use('/version', version.routes(), version.allowedMethods());
router.use('/jiayaosu', jiayaosu.routes(), jiayaosu.allowedMethods());

app.use(router.routes(), router.allowedMethods());
app.on('error', function (err, ctx) {
    log.error('server error' + err, ctx);
});

var common = require('./../lib/common');
if(g_config.common_wechat != null) {
    common.notifyWechatDev("server start! env:" + process.env.NODE_ENV);
}
if(g_config.common_email != null) {
    common.notifyEmail("server start!", "server start! env:" + process.env.NODE_ENV);
}

if(g_config.gank != null) {
    var gank = require('./../lib/gank/gank');
    gank.startGankSchedule();
}
module.exports = app;