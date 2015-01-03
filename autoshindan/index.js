var CronJob = require('cron').CronJob;
var async = require('async');
var time = require('time');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url');

var twitter = require('../twitter');

var latestShindanURL = 'http://shindanmaker.com/c/list';

module.exports = new CronJob('00 * * * * *', function () {
	async.waterfall([
		// Get latest shindan page
		request.bind(this, latestShindanURL),
		// Extract very latest shindan id
		function (responce, body, done) {
			if (responce.statusCode !== 200) return done(new Error('Status not OK'));

			var $ = cheerio.load(body);
			var id = $('.list_title').first().attr('href');
			if (!id) return done(new Error('Latest shindan not found'));
			var shindanUrl = url.resolve(latestShindanURL, id);

			return done(null, shindanUrl);
		},
		// Get very latest shindan page
		function (shindanUrl, done) {
			request.post(shindanUrl, {form: {u: '博多市'}}, done);
		},
		// Extract tweet intent contents
		function (responce, body, done) {
			if (responce.statusCode !== 200) return done(new Error('Status not OK'));

			var $ = cheerio.load(body);
			var intentUrl = $('.tweetform_sharebuttons_twitter_table a').first().attr('href');
			if (!intentUrl) return done(new Error('Intent URL not found'));
			var intentContent = url.parse(intentUrl, true).query.text;
			if (!intentContent) return done(new Error('Intent content not found'));

			return done(null, intentContent);
		},
		// Post tweet
		function (intentContent, done) {
			twitter.post('hakatashi_O', 'statuses/update', {
				status: intentContent
			}, done);
		}
	], function (error, responce, data) {
		if (error) console.error('autoshindan ERROR: ' + error.message);
		else console.log(JSON.stringify(data));
	});
}, null, true, 'Asia/Tokyo');
