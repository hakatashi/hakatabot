var CronJob = require('cron').CronJob;
var time = require('time');
var async = require('async');
var fs = require('fs');

var twitter = require('../twitter');

var frequency = 5;
var targets = ['hideo54'];

function repeat(string, times) {
	var ret = '';
	for (var i = 0; i < times; i++) ret += string;
	return ret;
}

module.exports = new CronJob('00 * * * * *', function () {
	var now = new Date();

	async.waterfall([
		function (done) {
			fs.readFile(__dirname + '/progress.json', done);
		},
		function (data, done) {
			var progresses = JSON.parse(data);

			async.each(targets, function (target, done) {
				var progress = progresses[target];

				twitter.get('hakatashi', 'statuses/user_timeline', {
					screen_name: target,
					since_id: progress.lastAlert,
					count: frequency,
					include_rts: false
				}, function (error, responce, data) {
					if (error) return done(error);
					if (data.length < frequency) return done();

					var lastTweet = data[0];
					var borderTweet = data[data.length - 1];
					var borderTime = new Date(borderTweet.created_at);
					var lastTime = new Date(lastTweet.created_at);

					if (lastTime - borderTime < 10 * 60 * 1000) {
						twitter.post('hakatashi', 'statuses/update', {
							status: '@' + target + ' 勉強しろ' + repeat('!', progress.alertTimes),
							in_reply_to_status_id: lastTweet.id_str
						});

						progress.lastAlert = lastTweet.id_str;
						progress.alertTimes++;
					}

					done();
				});
			}, function (error) {
				if (error) return done(error);

				fs.writeFile(__dirname + '/progress.json', JSON.stringify(progresses), done);
			});
		}
	], function (error) {
		if (error) console.error(error);
	});
}, null, true, 'Asia/Tokyo');
