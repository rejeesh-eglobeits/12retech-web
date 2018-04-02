const https = require('https');
const request = require('request');

(function () {
    'use strict';
    angular.module('usxsApp')
        .service('ScreenServices', ['$q', '$http', '$rootScope', 'DownloadServices','LogService', function ($q, $http, $rootScope, DownloadServices,LogService) {
            var tableName = 'screen_media';
            $rootScope.deleteScreenMediaFile = [];

            return {
                getWelcomeVideos: getWelcomeVideos,
                syncScreenVideos: syncScreenVideos,
                getScreenVideo: getScreenVideo,
                downloadMedia: downloadMedia,
                getScreenLanguageVideos:getScreenLanguageVideos
            };

            function getScreenVideo(mediaOption) {
                var screen_media_option = mediaOption;
                var deferred = $q.defer();
                var query = "SELECT screen_media_path,screen_media_option FROM " + tableName + " WHERE screen_media_option IN (?) AND download_status = 1";
                mysql.query(query, [screen_media_option], function (err, rows) {
                    if (err) deferred.reject(err);
                    if(rows)  deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function getWelcomeVideos() {
                var deferred = $q.defer();
                var query = "SELECT screen_media_path,screen_media_option FROM " + tableName + " WHERE screen_media_option IN('promotional','welcome') AND download_status = 1";
                mysql.query(query, [], function (err, rows) {
                    if (err) deferred.resolve('migration not applied yet');
                    if(rows)  deferred.resolve(rows);
                });
                return deferred.promise;
            }
            
            function getScreenMediaAll() {
                var deferred = $q.defer();
                var query = "SELECT * FROM " + tableName + " WHERE 1";
                mysql.query(query, [], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function syncScreenVideos() {
                return apiRequest().then(function (apiItems) {
                    apiItems = apiItems.data.data;
                    if (apiItems.length > 0) {
                        return getScreenMediaAll().then(function (mediaToDel) {
                            var mediaPromises = [];
                            var mediaPromise;
                            angular.forEach(apiItems, function (apiItem, key) {
                                if (apiItem.screen_media_url) {
                                    var data = {
                                        'screen_media_type': apiItem.screen_media_type,
                                        'screen_media_option': apiItem.screen_media_option,
                                        'screen_media_url': apiItem.screen_media_url,
                                        'screen_media_locale': apiItem.screen_media_locale || ''
                                    };
                                    var mediaIndex = mediaToDel.map(function (media) {
                                        return media.screen_media_url;
                                    }).indexOf(apiItem.screen_media_url);

                                    if (mediaIndex > -1) {
                                        mediaPromise = update(data, mediaToDel[mediaIndex].id);
                                        mediaToDel.splice(mediaIndex, 1);
                                    } else {
                                        mediaPromise = create(data);
                                    }
                                    mediaPromises.push(mediaPromise);
                                }
                            });

                            var mediaIds = [];
                            angular.forEach(mediaToDel, function (val, key) {
                                $rootScope.deleteScreenMediaFile.push(val.screen_media_path);
                                mediaIds.push(val.id);
                            });
                            deleteScreenMedia(mediaIds);

                            return $q.all(mediaPromises);
                        });
                    } else {
                        /**
                         * @todo delete saved medeas
                         */
                        return deleteScreenMediaAll();
                    }
                });
            }

            function apiRequest() {
                return $http.post(baseUrl+'/get-screen-content');
            }

            function create(data) {
                var deferred = $q.defer();
                var query = "INSERT INTO " + tableName + " SET ?";
                mysql.query(query, data, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res.insertId);
                });
                return deferred.promise;
            }

            function update(data, id) {
                var deferred = $q.defer();
                var query = "UPDATE " + tableName + " SET ? WHERE id = ?";
                mysql.query(query, [data, id], function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function deleteScreenMedia(id) {
                var deferred = $q.defer();
                if(id.length > 0){
                    var query = "DELETE FROM " + tableName + " WHERE id IN(?)";
                    mysql.query(query, [id], function (err, res) {
                        if (err) deferred.reject(err);
                        deferred.resolve();
                    });
                }
                return deferred.promise;
            }

            function deleteScreenMediaAll() {
                var deferred = $q.defer();
                var query = "DELETE FROM " + tableName + " WHERE 1";
                mysql.query(query, [], function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve();
                });
                return deferred.promise;
            }

            function downloadMedia() {
                var deferred = $q.defer();
                getDownloadables().then(function (res) {
                    var promises = [];
                    var promise;
                    angular.forEach(res, function (value, key) {
                        promise = DownloadServices.download(value.screen_media_url, value.id).then(function (res) {
                            LogService.success({'event': 'download screen media', 'log': 'download completed', 'trace': 'URL: ' + res.url + ', PATH: ' + res.path});
                            if (res.insertId > 0) {
                                var data = {
                                    'download_status' : 1,
                                    'screen_media_name' : res.filename,
                                    'screen_media_path' : res.filepath
                                }
                                return update(data, res.insertId);
                            }
                        },function (err) {
                            LogService.error({'event': 'download screen media', 'log': err});
                            return $q.resolve();
                        },function (prog) {
                            LogService.success({'event': 'download screen media', 'log': 'download started', 'trace': 'URL: ' + prog.url + ', PATH: ' + prog.path});
                        });
                        promises.push(promise);
                    });
                    $q.all(promises).then(function () {
                        deferred.resolve();
                    }, function (err) {
                        deferred.resolve();
                    });
                }, function () {
                    deferred.resolve();
                });
                return deferred.promise;
            }
            function getDownloadables() {
                var deferred = $q.defer();
                var query = "SELECT screen_media_url,id FROM " + tableName + " WHERE download_status = 0 AND screen_media_url IS NOT NULL";
                mysql.query(query, '', function (err, rows) {
                    if (err) deferred.resolve();
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function getScreenLanguageVideos(language_code) {
                var deferred = $q.defer();
                var query = "SELECT screen_media_path FROM " + tableName + " WHERE screen_media_option = 'language' AND download_status = 1 AND screen_media_locale = ?";
                mysql.query(query, [language_code], function (err, rows) {
                    if (err) deferred.resolve('migration not applied yet');
                    if(rows)  deferred.resolve(rows);
                });
                return deferred.promise;
            }

        }]);


})();