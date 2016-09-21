# node-super-bot

> j.s 🇨🇳
> 
> 持续集成的通知模块，让开发自动化且有乐趣。
 
<img src="https://github.com/w446108264/node-super-bot/raw/master/doc/intro.png" width="100%" /> 

# 介绍
> 简单的实践
 
<a href="http://www.shengjun.red/ci/ci.svg" ><img src="https://github.com/w446108264/node-super-bot/raw/master/doc/rec/ci.png" width="100%" /> </a>



# 部署

```shell
git clone https://github.com/w446108264/node-super-bot.git
cd node-super-bot
git submodule update --init --recursive
npm install
pm2 start bin/run

```

基础配置参考https://github.com/w446108264/node-super-bot/blob/master/config/default.json

# 效果

## 1.发布新版本推送通知

### 1.1推送到微信
<img src="https://github.com/w446108264/node-super-bot/raw/master/doc/rec/version_wechat.png" width="20%" /> 

### 1.2推送到slack
<img src="https://github.com/w446108264/node-super-bot/raw/master/doc/rec/version_slack.png" width="20%" /> 

## 2.主动获取版本履历
<img src="https://github.com/w446108264/node-super-bot/raw/master/doc/rec/version_history.png" width="20%" /> 

 
## 3.维持用户粘性👽

### 3.1定点推送gank图片至微信或主动获取随机gank图片
<img src="https://github.com/w446108264/node-super-bot/raw/master/doc/rec/gank_wechat.png" width="20%" /> 

### 3.2定点推送gank图片至slack
<img src="https://github.com/w446108264/node-super-bot/raw/master/doc/rec/gank_slack.png" width="20%" /> 


# Contact & Help

Please fell free to contact me if there is any problem when using the library.

* email: shengjun8486@gmail.com 

