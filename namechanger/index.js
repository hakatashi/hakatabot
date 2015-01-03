var CronJob = require('cron').CronJob;
var sqlite3 = require('sqlite3').verbose();
var time = require('time');

var twitter = require('../twitter');

var db = new sqlite3.Database(__dirname + '/aozora.sqlite3');

module.exports = new CronJob('00 */10 * * * *', function () {
	db.get('SELECT * FROM aozora ORDER BY RANDOM()', function (error, entry) {
		twitter.post('hakatashi_B', 'account/update_profile', {
			name: entry.entry
		}, function (error, responce, data) {
			if (error) console.error('namechanger ERROR: ' + error.message);
			else console.log(JSON.stringify(data));
		});
	});
}, null, true, 'Asia/Tokyo');
