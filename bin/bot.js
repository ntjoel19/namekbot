'use strict';

/**
 * @author Ntepp Jean Joel
 * Build a slack bot for AdipsterTech
 */

var SlackBot = require('../lib/slackbot');
var express = require('express')
var request = require('request')
var bodyParser = require('body-parser')
var app = express()

var urlencodedParser = bodyParser.urlencoded({ extended: false })

var token = process.env.bot_id_token;
var my_token = process.env.me_id_token;

app.get('/', (req, res) =>{
    console.log("you just clicked a button")
    res.send("you just clicked a button")
})

app.get('/buttons-actions', (req, res) =>{
    console.log("you just clicked a button")
    res.send("you just clicked a button")
})

function sendMessageToSlackResponseURL(responseURL, JSONmessage){
    var postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: JSONmessage
    }
    request(postOptions, (error, response, body) => {
        if (error){
            // handle errors as you see fit
            console.log("error "+error)
        }
    })
}

app.post('/buttons-actions', urlencodedParser, (req, res) =>{
    console.log("you just clicked a button")
    res.status(200).end() // best practice to respond with 200 status
    var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
    //console.log("actionJSONPayLoad = "+JSON.stringify(actionJSONPayload));
    slackbot.actionJSONPayLoad = actionJSONPayload;
    
    console.log("you have clicked on the button "+actionJSONPayload.actions[0].value);
    if(actionJSONPayload.actions[0].value === "dont_allow"){
        slackbot.actionJSONPayLoad = actionJSONPayload;
        var forwardedMSG = actionJSONPayload.original_message.text;
        var start_pos = forwardedMSG.indexOf("<") + 2;
        var end_pos = forwardedMSG.indexOf("|",start_pos);
        var original_channel = forwardedMSG.substring(start_pos,end_pos);
        console.log("channel = "+actionJSONPayload.original_message)
        //console.log("attachments V payload = "+JSON.stringify(actionJSONPayload.original_message.attachments)+"\n new ts="+actionJSONPayload.original_message.attachments[0].callback_id);
        //var params ={ts: actionJSONPayload.original_message.attachments[0].callback_id, channel: original_channel}
        var params ={token: my_token, ts: actionJSONPayload.original_message.ts, channel: actionJSONPayload.original_message.channel}
        slackbot.deleteMessage(params);
    }
    var message = {
        "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].value,
        "replace_original": false
    }
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})

var name = process.env.bot_name;
console.log("is the bot running?");
var slackbot = new SlackBot({
    token: token,
    name: name
});

var port = process.env.PORT || 8080;
app.listen(port, function () {
    console.log('the server for interactive message in listening on port '+port+'!');
    /**
    * Environment variables used to configure the bot:
    *
    *  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
    *      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
    *  BOT_DB_PATH: the path of the SQLite database used by the bot
    *  BOT_NAME: the username you want to give to the bot within your organisation.
    */
    slackbot.run();
})
