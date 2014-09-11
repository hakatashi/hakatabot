var CronJob = require('cron').CronJob;
var sqlite3 = require('sqlite3').verbose();
var time = require('time');

var twitter = require('../twitter');

var db = new sqlite3.Database(__dirname + '/ipadic.sqlite3');

module.exports = new CronJob('00 */10 * * * *', function () {
	db.get('SELECT * FROM ipadic ORDER BY RANDOM()', function (error, entry) {
		twitter.post('ipadic', 'statuses/update', {
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
