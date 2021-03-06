'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "Slackbot")
 *      dbPath : the path to access the database (will default to "data/Slackbot.db")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Ntepp jean joel <ntjoel19@gmail.com>
 */
var Slackbot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'Slackbot';
    //this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'Slackbot.db');

    this.dedicated_channel = "dedicated_channel";
    this.audition_channel = "audition_channel";
    this.activate_bot = "activate_bot";
    this.admin_id = ""
    this.user = "";
    this.actionJSONPayLoad = null;
    //this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(Slackbot, Bot);

/**
 * Run the bot
 * @public
 */
Slackbot.prototype.run = function() {
    Slackbot.super_.call(this, this.settings);

    this.on('start', this._onStart);

    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
Slackbot.prototype._onStart = function() {

    this._loadBotUser();
    console.log("Slackbot is online!!")

    //this._connectDb();
    //this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
Slackbot.prototype._onMessage = function(message) {

    if (this._isChatMessage(message) && (this._isChannelConversation(message) || this._isGroupConversation(message)) && !this._isFromSlackbot(message)) {
        this._forwardInTheDedicatedChannel(message);
    }
};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
Slackbot.prototype._forwardInTheDedicatedChannel = function(originalMessage) {
    var self = this;
    var channel = null;
    if (this._isGroupConversation(originalMessage)) channel = self._getGroupById(originalMessage.channel);
    if (this._isChannelConversation(originalMessage)) channel = self._getChannelById(originalMessage.channel);
    var sender = self._getUserById(originalMessage.user);
    var time_stamp = originalMessage.ts;
    //var time_stamp_parsed = time_stamp.replace(".","0000000000");
    //console.log("original message is = "+ JSON.stringify(originalMessage)+"\n ts="+time_stamp)
    var team_info = this.getTeamInfo({ token: this.settings.me_token });
    var team_name = "duo-code-temp";
    //if (typeof team_info !== 'undefined') team_name = team_info.team.domain
    var attach = [{
        "fallback": "Sorry, an audition problem occured!.",
        "color": "#3AA3E3",
        "text": originalMessage.text,
        "author_name": sender.name ,
        "author_link": "http://" + team_name + ".slack.com/messages/@" + sender.name + "/team/" + sender.name + "/",
        "author_icon": "http://flickr.com/icons/bobby.jpg",
        "callback_id": time_stamp,
        "attachment_type": "default",
        "actions": [{
                "name": "audit",
                "text": "Allow",
                "type": "button",
                "value": "allow"
            },
            {
                "name": "audit",
                "text": "Don't allow",
                "type": "button",
                "value": "dont_allow",
                "confirm": {
                    "title": "Are you sure?",
                    "text": "Wouldn't you prefer to delete this message?",
                    "ok_text": "Yes",
                    "dismiss_text": "No"
                }
            }
        ],
        "thumb_url": "http://example.com/path/to/thumb.png",
        "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
        "ts": time_stamp
    }]
    var attach2 = [{
        "fallback": "Sorry, an audition problem occured!.",
        "color": "#3AA3E3",
        "callback_id": time_stamp,
        "attachment_type": "default",
        "delete_original": false,
        "actions": [{
            "name": "activate",
            "text": "Turn the bot on",
            "type": "button",
            "value": "activate"
        }, ]
    }]

    if (originalMessage.text.indexOf("<@") > -1) {
        //if the user mentionned is ralph then forward the message into the dedicated_channel
        var start_pos = originalMessage.text.indexOf('@') + 1;
        var end_pos = originalMessage.text.indexOf('>', start_pos);
        var ralph_id = originalMessage.text.substring(start_pos, end_pos)
        var ralph_data = self._getUserById(ralph_id);

        if (ralph_data.name == "namek") {
            var messageToPost = this._buildTheMessage(originalMessage);
            //console.log("message to forward to the dedicated channel = "+messageToPost)
            this.postTo(this.dedicated_channel, messageToPost, { as_user: true });
            this.postTo(this.activate_bot, "", { as_user: true, attachments: JSON.stringify(attach2) });
        }
    }
    this.postTo(this.audition_channel, "*Notification from <#" + originalMessage.channel + "|" + channel.name + ">*", { as_user: true, attachments: JSON.stringify(attach) });
};

/**
 * Composes the message that will be pushed to the dedicated channel from the original message
 * @param {object} originalMessage
 * @private
 **/
Slackbot.prototype._buildTheMessage = function(originalMessage) {
    var self = this;
    var channel = null;
    if (this._isGroupConversation(originalMessage)) channel = self._getGroupById(originalMessage.channel);
    if (this._isChannelConversation(originalMessage)) channel = self._getChannelById(originalMessage.channel);
    var sender = self._getUserById(originalMessage.user);
    //qconsole.log("<#"+originalMessage.user+">\n")
    var messageToPost = "*From <#" + originalMessage.channel + "|" + channel.name + ">, <@" + originalMessage.user + "|" + sender.name + "> wrote:* " + originalMessage.text;

    return messageToPost;
};

/**
 * This function loads all the users of the team
 * @private
 */
Slackbot.prototype._loadBotUser = function() {
    var self = this;
    this.user = this.users.filter(function(user) {
        self.postTo(user.name, "hello welcome "+user.name+", I am the bot", { as_user: true});
        console.log("users of the team: " + user.name + " ID = " + user.id)
        return user.name === self.name;
    })[0];
};

/**
 * Sends a welcome message in the channel
 * @private
 */
Slackbot.prototype._welcomeMessage = function() {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!', { as_user: true });
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
Slackbot.prototype._isChatMessage = function(message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
Slackbot.prototype._isChannelConversation = function(message) {
    return typeof message.channel === 'string' && message.channel[0] === 'C';
};

/**
 * Util function to check if a given real time message object is directed to a private group
 * @param {object} message
 * @returns {boolean}
 * @private
 */
Slackbot.prototype._isGroupConversation = function(message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'G';
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the Slackbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
Slackbot.prototype._isMentioningSlackBot = function(message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the Slackbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
Slackbot.prototype._isFromSlackbot = function(message) {
    //console.log("message.user="+message.user+" this.user.name="+this.user.id)
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
Slackbot.prototype._getChannelById = function(channelId) {
    return this.channels.filter(function(item) {
        return item.id === channelId;
    })[0];
};

Slackbot.prototype._getGroupById = function(groupId) {
    return this.groups.filter(function(item) {
        return item.id === groupId;
    })[0];
};

Slackbot.prototype._getUserById = function(userId) {
    return this.users.filter(function(item) {
        return item.id === userId
    })[0];
};

Slackbot.prototype._getUserById = function(userId) {
    return this.users.filter(function(item) {
        return item.id === userId
    })[0];
};

Slackbot.prototype.getTeamInfo = function(params) {
    var self = this;
    return this._api('team.info', params);
};

/**
 * delete a message knowing it ts
 * @param {object} params 
 */
Bot.prototype.deleteMessage = function(params) {
    var self = this;
    return this._api('chat.delete', params);
}
module.exports = Slackbot;