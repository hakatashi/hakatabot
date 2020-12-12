var CronJob = require('cron').CronJob;
var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var url = require('url');

var twitter = require('../twitter');

var randomGlyphURL = 'http://glyphwiki.org/wiki/Special:Random';
var glyphImageURL = 'http://glyphwiki.org/glyph/';

module.exports = new CronJob('00 */30 * * * *', function () {
	async.waterfall([
		// Get random glyph
		request.bind(this, {url: randomGlyphURL, followRedirect: false}),
		// Extract random glyph destination
		function (response, body, done) {
			if (response.statusCode !== 302 && response.statusCode !== 301) return done(new Error('Status not OK'));

			var glyphUrl = url.resolve(randomGlyphURL, response.headers.location);
			if (!glyphUrl) return done(new Error('Glyph URL not found'));

			return done(null, glyphUrl);
		},
		// Get glyph info and upload image simultaneously
		function (glyphUrl, done) {
			var id = glyphUrl.match(/^http:\/\/glyphwiki\.org\/wiki\/(.+)$/)[1];
			if (!id) return done(new Error('Glyph ID not found'));

			async.parallel({
				// Get glyph information
				meta: async.waterfall.bind(this, [
					// Get glyph page... yes by default of request encoding, utf-8
					request.bind(this, glyphUrl),
					// Extract glyph information
					function (response, body, done) {
						if (response.statusCode !== 200) return done(new Error('Status not OK'));

						var info = {url: glyphUrl};

						var $ = cheerio.load(body);
						info.metaName = $('h1 span').first().text();
						if (!info.metaName) return done(new Error('Meta name not found'));

						$('h1 span').remove();
						info.id = $('h1').text().trim();
						if (!info.id) return done(new Error('Glyph ID not found'));

						return done(null, info);
					}
				]),
				// Fetch and upload glyph image
				media: async.waterfall.bind(this, [
					// Pipe out image request to twitter upload
					function (done) {
						var imageUrl = glyphImageURL + id + '.png';
						// https://github.com/request/request#multipartform-data-multipart-form-uploads
						twitter.uploadMedia('GlyphWikiBot', 'media/upload', {
							media: request(imageUrl)
						}, done);
					},
					// Extract media id
					function (response, data, done) {
						if (!data.media_id_string) {
							console.log(data);
							return done(new Error('Media upload error'));
						} else return done(null, data.media_id_string);
					}
				])
			}, done);
		},
		// Fetch image and post tweet
		function (info, done) {
			twitter.post('GlyphWikiBot', 'statuses/update', {
				status: info.meta.id + info.meta.metaName + ' ' + info.meta.url,
				media_ids: info.media
			}, done);
		}
	], function (error, response, data) {
		if (error) console.error('glyphwikibot ERROR: ' + error.message);
		else console.log(JSON.stringify(data));
	});
}, null, true, 'Asia/Tokyo');
