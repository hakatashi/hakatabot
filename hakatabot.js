var querystring = require('querystring');
var request = require('request');
var CronJob = require('cron').CronJob;
var sqlite3 = require('sqlite3').verbose();
var time = require('time');
var config = require('cson').parseFileSync('config.cson');

var APIBase = 'https://api.twitter.com/1.1/';
var db = new sqlite3.Database('ipadic.sqlite3');

var twitter = function (method, account, resource, params, callback) {
	var paramString = querystring.stringify(params)
		.replace(/\!/g, "%21")
		.replace(/\'/g, "%27")
		.replace(/\(/g, "%28")
		.replace(/\)/g, "%29")
		.replace(/\*/g, "%2A"); // f*cking twitter implementation

	request({
		url: APIBase + resource + '.json' + '?' + paramString,
		oauth: config.oauth,
		json: true,
		method: method,
	}, callback);
};

twitter.get = function (account, resource, params, callback) {
	twitter('GET', account, resource, params, callback);
};

twitter.post = function (account, resource, params, callback) {
	twitter('POST', resource, params, callback);
};

var cronJob = new CronJob('00 */10 * * * *', function () {
	db.get('SELECT * FROM ipadic ORDER BY RANDOM()', function (error, entry) {
		twitter.post('statuses/update', {
			status: entry.entry
		}, function (error, responce, data) {
			if (error) {
				console.error(error);
				return;
			}

			console.log(data);
		});
	});
}, null, true, 'Asia/Tokyo');
