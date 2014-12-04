var CronJob = require('cron').CronJob;
var time = require('time');
var fs = require('fs');

var twitter = require('../twitter');

var alertTimes = 0;

var frequency = 5;

function repeat(string, times) {
	var ret = '';
	for (var i = 0; i < times; i++) ret += string;
	return ret;
}

module.exports = new CronJob('00 * * * * *', function () {
	var now = new Date();

	fs.readFile(__dirname + '/lastalert.txt', function (error, data) {
		if (error) return console.error(error);

		var lastAlert = data.toString();

		twitter.get('hakatashi', 'statuses/user_timeline', {
			screen_name: 'hideo54',
			since_id: lastAlert,
			count: frequency,
			include_rts: false
		}, function (error, responce, data) {
			if (error) return console.error(error);
			if (data.length < frequency) return;

			var lastTweet = data[0];
			var borderTweet = data[frequency - 1];
			var borderTime = new Date(borderTweet.created_at);
			var lastTime = new Date(lastTweet.created_at);

			if (lastTime - borderTime < 10 * 60 * 1000) {
				twitter.post('hakatashi', 'statuses/update', {
					status: '@hideo54 勉強しろ' + repeat('!', alertTimes),
					in_reply_to_status_id: lastTweet.id_str
				});

				lastAlert = lastTweet.id_str;
				alertTimes++;
			}

			fs.writeFile(__dirname + '/lastalert.txt', lastAlert);
		});
	});
}, null, true, 'Asia/Tokyo');
