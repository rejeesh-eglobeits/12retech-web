var ipc = require('electron').ipcRenderer;

(function () {
    'use strict';

    angular.module('usxs.services', [])
        .service('appService', [
            '$q',
            '$rootScope',
            '$timeout',
            'LanguageService',
            'ScreenServices',
            'ConfigService',
            'ProductService',
            'AnalyticsService',
            'MigrationService',
            'WebApiService',
            'DatabaseService',
            'DeleteService',
            'LogService',
            '$injector',
            function ($q,
                      $rootScope,
                      $timeout,
                      LanguageService,
                      ScreenServices,
                      ConfigService,
                      ProductService,
                      AnalyticsService,
                      MigrationService,
                      WebApiService,
                      DatabaseService,
                      DeleteService,
                      LogService,
                      $injector) {
                var self = this;
                self.authUrl = baseUrl;
                
                self.start = function () {
                    /**
                     * Sending heartbeat on intervals
                     * @todo get newly changed api
                     */
                    ConfigService.init();
                    if($rootScope.online == true) {
                        WebApiService.processHeartBeat();
                        AnalyticsService.sendAnalytics();
                        LogService.sendLog();
                        // $state.go('usxs.' + localStorage.device_type);
                    }
                }

                self.stop = function () {
                    $timeout.cancel($rootScope.heartBeatTOout);
                    $timeout.cancel($rootScope.analyticsTOut);
                    // $interval.cancel($rootScope.pageTimeout);
                    $timeout.cancel($rootScope.camTimeout);

                    // MotionDetectService.stop();
                    // MotionDetectService.motionStatus = 'Out';
                    // $state.go('usxs.'+localStorage.device_type);
                }
                
                self.initSetup = function () {
                    localStorage.initSetup = true;

                    return DatabaseService.createConnection().then(function () {
                        return MigrationService.init().then(function () {

                            var dbCallback,service;
                            while ($rootScope.dbCallback.length > 0 ){
                                dbCallback = $rootScope.dbCallback.shift();
                                service = $injector.get(dbCallback.service);
                                service[dbCallback.method](dbCallback.data);
                            }
                            dbCallback = service = null;

                            return ConfigService.init().then(function () {
                                ConfigService.getRestartTime().then(function (res) {
                                    ipc.send('restart',res);
                                });
                                if($rootScope.online === true) {
                                    return self.initSync();
                                } else {
                                    localStorage.removeItem("initSetup");
                                    return $q.resolve();
                                }

                            });

                        });
                    });

                };

                self.initSync = function () {
                    var deferred = $q.defer();
                    var promises = [];
                    promises.push(self.syncLanguages());
                    promises.push(self.syncConfig());
                    promises.push(self.ScreenVideos());
                    promises.push(self.Products());

                    $q.all(promises).then(function () {
                        localStorage.removeItem("initSetup");
                        ConfigService.getRestartTime().then(function (res) {
                           ipc.send('restart',res);
                        });
                        deferred.resolve();
                    }, function (err) {
                        localStorage.removeItem("initSetup");
                        deferred.reject(err);
                    });
                    return deferred.promise;
                }


                self.syncLanguages = function () {
                    return LanguageService.getLanguages().then(function (res) {
                        return res;
                    },function (err) {
                        LogService.error({'event': 'sync languages', 'log': err});

                        var callbackIndex = $rootScope.callbacks.map(function (callback) {
                            return callback.name;
                        }).indexOf('languages');

                        if(callbackIndex === -1){
                            var callback = {'callback':self.syncLanguages, 'name':'languages'}
                            $rootScope.callbacks.push(callback);
                        }
                        return $q.resolve();
                    });
                };

                self.syncConfig = function () {
                    return ConfigService.syncConfig().then(function (res) {
                        return res;
                    },function (err) {
                        /**
                         * @todo log error
                         *
                         */
                        var callbackIndex = $rootScope.callbacks.map(function (callback) {
                            return callback.name;
                        }).indexOf('config');

                        if(callbackIndex === -1){
                            var callback = {'callback':self.syncConfig, 'name':'config'}
                            $rootScope.callbacks.push(callback);
                        }
                        return $q.resolve();
                    });
                };

                self.ScreenVideos = function () {
                    return ScreenServices.syncScreenVideos().then(function (result) {
                        return ScreenServices.downloadMedia().then(function () {
                            while ($rootScope.deleteScreenMediaFile.length > 0 ){
                                var file = $rootScope.deleteScreenMediaFile.shift();
                                DeleteService.deleteFile(file).then(function (file) {
                                    LogService.success({'event': 'delete screen media', 'log': 'deleted', 'trace': file});
                                },function (err) {
                                    LogService.success({'event': 'delete screen media', 'log': err});
                                });
                            }
                        });
                    },function (err) {
                        LogService.error({'event': 'sync screen media', 'log': err});
                        var callbackIndex = $rootScope.callbacks.map(function (callback) {
                            return callback.name;
                        }).indexOf('ScreenVideos');

                        if(callbackIndex === -1){
                            var callback = {'callback':self.ScreenVideos, 'name':'ScreenVideos'}
                            $rootScope.callbacks.push(callback);
                        }
                        return $q.resolve();
                    });
                }

                self.Products = function () {
                    return ProductService.syncProductsListMedia().then(function (result) {
                        return ProductService.downloadMedia().then(function () {
                            while ($rootScope.deleteMediaFile.length > 0 ){
                                var file = $rootScope.deleteMediaFile.shift();
                                DeleteService.deleteFile(file).then(function (file) {
                                    LogService.success({'event': 'delete product media', 'log': 'deleted', 'trace': file});
                                },function (err) {
                                    LogService.success({'event': 'delete product media', 'log': err});
                                });
                            }
                        });
                    },function (err) {
                        /**
                         * @todo log error
                         */
                        var callbackIndex = $rootScope.callbacks.map(function (callback) {
                            return callback.name;
                        }).indexOf('Products');

                        if(callbackIndex === -1){
                            var callback = {'callback':self.Products, 'name':'Products'}
                            $rootScope.callbacks.push(callback);
                        }
                        return $q.resolve();
                    });
                }

                self.getClientLogo = function () {
                    var media_option ='client_logo';
                    var deferred = $q.defer();
                    var query = "SELECT screen_media_path FROM screen_media WHERE screen_media_option = ?";
                    mysql.query(query, [media_option], function (err, rows) {
                        if (err) deferred.reject(err);
                        deferred.resolve(rows);
                    });
                    return deferred.promise;
                }
                return self;
            }]);
})();
