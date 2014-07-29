var querystring = require('querystring');
var request = require('request');
var config = require('./config');
var APIBase = 'https://api.twitter.com/1.1/';

var twitter = function (method, resource, params, callback) {
	request({
		url: APIBase + resource + '.json' + '?' + querystring.stringify(params),
		oauth: {
			consumer_key: config.ACCESS.CONSUMER.KEY,
			consumer_secret: config.ACCESS.CONSUMER.SECRET,
			token: config.ACCESS.TOKEN.KEY,
			token_secret: config.ACCESS.TOKEN.SECRET,
		},
		json: true,
		method: method,
	}, callback);
};

twitter.get = function (resource, params, callback) {
	twitter('GET', resource, params, callback);
};

twitter.post = function (resource, params, callback) {
	twitter('POST', resource, params, callback);
};

twitter.get('users/show', {
	screen_name: 'hakatashi'
}, function (error, responce, data) {
	if (error) console.error(error);
	console.log(data);
});
