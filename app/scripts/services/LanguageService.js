(function () {
    'use strict';

    angular.module('usxsApp')
        .service('LanguageService', ['$q', '$http','ScreenServices', 'LogService', function ($q, $http,ScreenServices, LogService) {
            var tableName = 'language';
            var current_date = new Date();
            return {
                getLanguages: getLanguages,
                getByLanguageCode: getByLanguageCode,
                getScreenLanguages:getScreenLanguages,
                getBackgroundVideo:getBackgroundVideo,
                getScreenLanguageVideos:getScreenLanguageVideos

            }
            function create(data) {
                var deferred = $q.defer();
                var query = "INSERT INTO language SET ?";
                mysql.query(query, data, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res.insertId);
                });
                return deferred.promise;
            }

            function update(data) {
                var deferred = $q.defer();
                var query = "UPDATE language SET language_label = ?, language_name = ?, updated_at = ? WHERE language_code = ?";
                mysql.query(query, [data.language_label,data.language_name, current_date,data.language_code], function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }


            function getLanguages() {
                return apiRequest().then(function (apiLangs) {
                    apiLangs = apiLangs.data.data;
                    if (apiLangs.length > 0) {
                        return getScreenLanguages().then(function (langToDel) {
                            var promises = [];
                            var promise;
                            angular.forEach(apiLangs, function (apiLang, key) {
                                var langIndex = langToDel.map(function (lang) {
                                    return lang.language_code;
                                }).indexOf(apiLang.locale);

                                var dataToStore = {
                                    "language_code": apiLang.locale,
                                    "language_label": apiLang.label,
                                    "language_name": apiLang.name
                                }

                                if (langIndex > -1) {
                                    langToDel.splice(langIndex, 1);
                                    promise = update(dataToStore);
                                } else {
                                    promise = create(dataToStore).then(function (res) {
                                        LogService.success({'event': 'sync languages', 'log': apiLang.label + ' language added: insert-id: ' + res});
                                        return res;
                                    });
                                }
                                promises.push(promise);
                            });

                            var langCodes = [];
                            angular.forEach(langToDel, function (val, key) {
                                langCodes.push(val.language_code);
                                LogService.success({'event': 'sync languages', 'log': val.language_label + ' language deleted'});
                            });
                            deleteLanguages(langCodes);

                            return $q.all(promises);
                        });
                    } else {
                        return deleteLanguagesAll();
                    }
                });
            }

            function apiRequest() {
                return $http.post(baseUrl+'/get-languages-of-screen');
            }

            function getByLanguageCode(languageCode) {
                var deferred = $q.defer();
                var query = "SELECT * FROM "+tableName+" WHERE language_code = ?";
                mysql.query(query, [languageCode], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function deleteLanguages(langCodes) {
                var deferred = $q.defer();
                if(langCodes.length > 0) {
                    var query = "DELETE FROM " + tableName + " WHERE language_code in(?)";
                    mysql.query(query, [langCodes], function (err, rows) {
                        if (err) deferred.reject(err);
                        deferred.resolve(rows);
                    });
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function deleteLanguagesAll() {
                var deferred = $q.defer();
                var query = "DELETE FROM " + tableName + " WHERE 1";
                mysql.query(query, [], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function getScreenLanguages() {
                var deferred = $q.defer();
                var query = "SELECT * FROM  " + tableName;
                mysql.query(query,function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            // function getScreenLanguageVideos(language_code) {
            //     return ScreenServices.getScreenLanguageVideos(language_code);
            // }

            function getScreenLanguageVideos() {
                return ScreenServices.getScreenVideo('language');
            }
            
            function getBackgroundVideo() {
                return ScreenServices.getScreenVideo(['language_background','language']);
            }
        }]);
})();
