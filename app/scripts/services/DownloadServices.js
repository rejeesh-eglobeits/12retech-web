(function () {
    'use strict';
    angular.module('usxsApp')
        .service('DownloadServices', ['$q', function ($q) {
            var screen_media_table = 'screen_media';
            var product_media_table = 'product_media';

            return {
                downloadMedia: downloadMedia,
                download: download,
            };

            function getMeidaUrlColName(tableName) {
                if (tableName === screen_media_table) {
                    return 'screen_media_url';
                } else {
                    return 'product_media_url';
                }
            }

            function createDirectoryAssets() {
                if (!fs.existsSync(createdir)) {
                    fs.mkdirSync(createdir, parseInt('0777', 8));
                }
            }

            function isMediaExists(url, table_name) {
                var deferred = $q.defer();
                var colName = getMeidaUrlColName(table_name);
                var query = "SELECT * FROM " + table_name + " WHERE " + colName + " = ?";
                mysql.query(query, [url], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function downloadMedia(url, table_name) {
                var deferred = $q.defer();
                isMediaExists(url, table_name).then(function (res) {
                    if (res.length > 0) {
                        deferred.reject(true);
                    } else {
                        download(url).then(function (res) {
                            deferred.resolve(res);
                        }, function () {
                            deferred.reject(err)
                        });
                    }
                });
                return deferred.promise;
            }

            function download(url, id) {
                createDirectoryAssets();
                var deferred = $q.defer();
                var filename = url.substring(url.lastIndexOf('/') + 1);
                var extension = filename.substr(filename.lastIndexOf('.') + 1);
                var newfileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 5) + filename;
                var dest = path.join(createdir, newfileName);
                var filepath = path.join(dir, newfileName);
                var file = fs.createWriteStream(dest);
                request.get(url).on('response', function (response) {
                    if (response.statusCode !== 200) {
                        deferred.resolve();
                    } else {
                        var result = {
                            'url': url,
                            'path': dest
                        };
                        deferred.notify(result);
                    }
                }).pipe(file);
                file.on('finish', function () {
                    file.close();
                    var result = {
                        'filename': newfileName,
                        'filepath': filepath,
                        'url': url,
                        'path': dest
                    };
                    if (id != null) {
                        result.insertId = id;
                    }
                    deferred.resolve(result);
                }, function (err) {

                    deferred.resolve();
                });
                return deferred.promise;
            }

        }]);


})();