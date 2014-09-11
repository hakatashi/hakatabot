var sqlite3 = require('sqlite3').verbose();
var glob = require('glob');
var async = require('async');
var iconv = require('iconv-lite');

var fs = require('fs');

var db = new sqlite3.Database(__dirname + '/aozora.sqlite3');

var NUM = 10000;

async.series([
	function (done) {
		db.get('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'aozora\'', function (error, row) {
			if (error) {
				done(error);
				return;
			}

			if (!row) {
				db.run('CREATE TABLE aozora(id INTEGER PRIMARY KEY AUTOINCREMENT, entry TEXT)', function (error) {
					if (error) {
						done(error);
						return;
					}

					done();
				});
			} else {
				done();
			}
		});
	},
	function (done) {
		glob('青空文庫/*/*.txt', function (error, files) {
			var size = files.length;

			var cnt = 0;

			async.eachLimit(new Array(NUM), 5, function (file, done) {
				var file = files[Math.floor(Math.random() * size)];

				fs.readFile(file, function (error, data) {
					if (error) {
						done(error);
						return;
					}

					data = iconv.decode(data, 'Shift_JIS');
					data = data.replace(new RegExp('(\r\n|\r|\n|　)', 'g'), '');
					data = data.replace(new RegExp('底本：.*$'), '');
					data = data.replace(new RegExp('-{15,}.*?-{15,}'), '');
					data = data.replace(new RegExp('《.+?》', 'g'), '');
					data = data.replace(new RegExp('［.+?］', 'g'), '');
					data = data.replace(new RegExp('〔.+?〕', 'g'), '');
					data = data.replace(new RegExp('[\x00-\x7F]{15,}', 'g'), '');
					var dataSize = data.length;
					var index = Math.floor(Math.random() * (dataSize - 20));
					var entry = data.substr(index, 20);

					db.run('INSERT INTO aozora(entry) VALUES ($entry)', {
						$entry: entry
					}, function (error) {
						cnt++;
						if (cnt % 50 === 0) console.log(cnt);

						if (error) done(error);
						else done();
					});
				});
			}, done);
		});
	}
], function (error) {
	if (error) console.error(error);
	else console.log('ok');
});
