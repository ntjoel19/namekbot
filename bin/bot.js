'use strict';

/**
 * NorrisBot launcher script.
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */

var SlackBot = require('../lib/slackbot');
var express = require('express')
var request = require('request')
var bodyParser = require('body-parser')
var app = express()

var urlencodedParser = bodyParser.urlencoded({ extended: false })

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
        }
    })
}

app.post('/buttons-actions', urlencodedParser, (req, res) =>{
	console.log("you just clicked a button")
    res.status(200).end() // best practice to respond with 200 status
    var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
    var message = {
        "text": actionJSONPayload.user.name+" clicked: "+actionJSONPayload.actions[0].name,
        "replace_original": false
    }
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})

app.listen(PORT, function () {
	console.log('the server for interactive message in listening on port 3000!');
	/**
	* Environment variables used to configure the bot:
	*
	*  BOT_API_KEY : the authentication token to allow the bot to connect to your slack organization. You can get your
	*      token at the following url: https://<yourorganization>.slack.com/services/new/bot (Mandatory)
	*  BOT_DB_PATH: the path of the SQLite database used by the bot
	*  BOT_NAME: the username you want to give to the bot within your organisation.
	*/
	var token = "xoxb-178349180784-xiEocYljowt9DlQLnVeXV8DQ";
	//var dbPath = process.env.BOT_DB_PATH;
	var name = "starterbot";

	var slackbot = new SlackBot({
		token: token,
		name: name
	});

	slackbot.run();
})
