/**
 * slack
 * Website: https://api.slack.com/incoming-webhooks
 */
let request = require("request");

/**
 * post any to slack.{@link https://api.slack.com/incoming-webhooks}
 * @param channel the slack channel which you will send to.
 * @param attachments {@code {
        "icon_emoji": "icon_emoji",
        "username": "username",
        "attachments": [
            {
                "fallback": "Required plain-text summary of the attachment.",
                "color": "#36a64f",
                "pretext": "Optional text that appears above the attachment block",
                "author_name": "Bobby Tables",
                "author_link": "http://flickr.com/bobby/",
                "author_icon": "http://flickr.com/icons/bobby.jpg",
                "title": "Slack API Documentation",
                "title_link": "https://api.slack.com/",
                "text": "Optional text that appears within the attachment",
                "fields": [{
                    "title": "Priority",
                    "value": "High",
                    "short": false
                }],
                "image_url": "https://raw.githubusercontent.com/w446108264/XhsEmoticonsKeyboard/master/output/chat-bigimage.png",
                "thumb_url": "https://raw.githubusercontent.com/w446108264/XhsEmoticonsKeyboard/master/output/chat-bigimage.png",
                "footer": "Slack API",
                "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                "ts": 123456789
            }
        ]
 }}, more detail please see {@link https://api.slack.com/docs/message-attachments}
 * @param callback
 */
exports.postSlack = function (channel, attachments, callback) {
    var options = {
        uri: channel,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: attachments
    };
    request(options, function (error, response, body) {
        callback(error, response, body);
    });
}

/**
 * post a simple text to slack.
 * @param channel the slack channel which you will send to.
 * @param icon_emoji who's avatar.
 * @param username who's name.
 * @param text content that will be send to slack
 * @param callback
 */
exports.postSlackSimple = function (channel, icon_emoji, username, text, callback) {
    var options = {
        uri: channel,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: {
            "text": text,
            "icon_emoji": icon_emoji,
            "username": username
        }
    };
    request(options, function (error, response, body) {
        callback(error, response, body);
    });
}

/**
 * post a image to slack. {@link #postSlack}
 * @param channel the slack channel which you will send to.
 * @param icon_emoji who's avatar.
 * @param username who's name.
 * @param uri a network image's url which will be send to slack.
 * @param callback
 */
exports.postSlackImage = function (channel, icon_emoji, username, uri, callback) {
    var slackJson = {
        "icon_emoji": icon_emoji,
        "username": username,
        "attachments": [
            {
                "fallback": "",
                "color": "#36a64f",
                "pretext": "",
                "author_name": "",
                "author_link": "",
                "author_icon": "",
                "title": "",
                "title_link": "",
                "text": "",
                "image_url": uri,
                "thumb_url": uri,
                "footer": "",
                "footer_icon": "",
                "ts": "",
                "mrkdwn_in": ["text", "pretext"]
            }
        ]
    }
    exports.postSlack(channel, slackJson, callback);
}


