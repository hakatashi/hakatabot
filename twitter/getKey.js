var request = require('request');
var open = require('open');
var CSON = require('cson');

var readline = require('readline');
var qs = require('querystring');
var fs = require('fs');

var config = require('cson').parseFileSync('config.cson');

var oauth =	{
	callback: 'oob',
	consumer_key: config.oauth.consumer_key,
	consumer_secret: config.oauth.consumer_secret,
};

var url = 'https://api.twitter.com/oauth/request_token';

request.post({url: url, oauth: oauth}, function (e, r, body) {
	var access_token = qs.parse(body);
	var oauth = {
		oauth_token: access_token.oauth_token,
	};

	var url = 'https://api.twitter.com/oauth/authenticate?' + qs.stringify(oauth);
	open(url);

	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question("PIN? ", function (PIN) {
		rl.close();

		var oauth = {
			consumer_key: config.oauth.consumer_key,
			consumer_secret: config.oauth.consumer_secret,
			token: access_token.oauth_token,
			verifier: PIN,
		};

		var url = 'https://api.twitter.com/oauth/access_token';

		request.post({url: url, oauth: oauth}, function (e, r, body) {
			var tokens = qs.parse(body);

			var config = CSON.parseFileSync('config.cson');
			config.oauth[tokens.screen_name] = tokens;
			CSON.stringify(config, function (error, string) {
				fs.writeFile('config.cson', string, function () {
					console.log('ok.');
				});
			});
		});
	});
});
