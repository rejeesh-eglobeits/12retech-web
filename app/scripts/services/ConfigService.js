(function () {
    'use strict';

    angular.module('usxsApp')
        .service('ConfigService', ['$q', '$rootScope', '$http', function ($q, $rootScope, $http) {
            var algorithm = 'aes-256-ctr', salt = 'saed123!@WQS5#';
            return {
                init:init,
                save: save,
                create: create,
                update: update,
                deleteConfig: deleteConfig,
                getLoginCredentials: getLoginCredentials,
                getConfigBykey: getConfigBykey,
                getConfigAll: getConfigAll,
                syncConfig: syncConfig,
                // getConfig: getConfig,
                getPageTimeout:getPageSessionTime,
                getHeartbeatTimeout:getHeartbeatTimeout,
                getRestartTime:getRestartTime,
                getscreenMediaTimeout:getscreenMediaTimeout,
                getAnalyticsTimeout:getAnalyticsTimeout,
                getLogTimeout:getLogTimeout,
                encrypt:encrypt,
                decrypt:decrypt,
                getNetworkTimeout:getNetworkTimeout,
                isVisibleQrCode:isVisibleQrCode,
                isVisiblePrice:isVisiblePrice
            };
            
            function init() {
                $rootScope.config = [];
                return getConfigAll().then(function (res) {
                    if (res.length > 0) {
                        angular.forEach(res, function (val, key) {
                         //   console.log(val+":"+key);
                            $rootScope.config[val.config_key] = val.config_value;
                        });
                        return $q.resolve();
                    } else {
                        /**
                         * @todo
                         *
                         * reject this after config api complete
                         */
                        return $q.resolve();
                    }
                });
            }

            function syncConfig() {
                return apiRequest().then(function (apiConfigs) {
                    apiConfigs = apiConfigs.data.data;
                    if (apiConfigs) {
                        return getConfigApiAll().then(function (configToDel) {
                            var promises = [];
                            var promise;
                            angular.forEach(apiConfigs, function (configVal, configKey) {
                                var configIndex = configToDel.map(function (config) {
                                    return config.config_key;
                                }).indexOf(configKey);

                                if (configIndex > -1) {
                                    promise = updateById(configVal, configToDel[configIndex].id);
                                    configToDel.splice(configIndex, 1);
                                } else {
                                    var data = {
                                        'config_key': configKey,
                                        'config_value': configVal,
                                        'config_type': 'api'
                                    };
                                    promise = create(data);
                                }
                                promises.push(promise);
                            });

                            var configIds = [];
                            angular.forEach(configToDel, function (val, key) {
                                configIds.push(val.id);
                            });
                            deleteConfig(configIds);

                            return $q.all(promises);
                        });
                    } else {
                        return deleteConfigAll();
                    }
                });
            }

            /**
             * Save config values
             * @param data
             */
            function save(data) {
                getConfigBykey(data.config_key).then(function (res) {
                    if (res[0]) {
                        update(data);
                    } else {
                        create(data);
                    }
                });
            }

            /**
             * create config
             * @param config
             */
            function create(config) {
                var deferred = $q.defer();
                var query = "INSERT INTO config SET ?";
                mysql.query(query, config, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res.insertId);
                });
                return deferred.promise;
            }

            /**
             * Get config value by config key
             * @param key
             */
            function getConfigAll() {
                var deferred = $q.defer();
                var query = "SELECT * FROM config";
                mysql.query(query, function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            /**
             * Get config value by config key
             * @param key
             */
            function getConfigApiAll() {
                var deferred = $q.defer();
                var query = "SELECT * FROM config WHERE config_type = 'api'";
                mysql.query(query, function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            /**
             * Get config value by config key
             * @param key
             */
            function getConfigBykey(key) {
                var deferred = $q.defer();
                var query = "SELECT config_value FROM config WHERE config_key = ?";
                mysql.query(query, [key], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            /**
             * Get Login credentials
             */
            function getLoginCredentials() {
                var deferred = $q.defer();
                var query = "SELECT config_value FROM config WHERE config_key = ? OR config_key = ? ORDER BY config_key";
                mysql.query(query, ["username","password"], function (err, rows) {
                    if (err) deferred.reject(err);
                    if(rows.length > 0){
                        var loginDetails ={
                            "password":rows[0].config_value,
                            "username":rows[1].config_value,
                        }
                        deferred.resolve(loginDetails);
                    }else{
                        deferred.reject("No username and password available");
                    }

                });
                return deferred.promise;
            }

            /**
             * Delete config
             */
            function deleteConfig(id) {
                var deferred = $q.defer();
                if(id.length > 0) {
                    var query = "DELETE FROM config WHERE id IN(?)";
                    mysql.query(query, [id], function (err, res) {
                        if (err) deferred.reject(err);
                        deferred.resolve(res);
                    });
                }
                return deferred.promise;
            }

            /**
             * Delete config
             */
            function deleteConfigAll() {
                var deferred = $q.defer();
                var query = "DELETE FROM config WHERE 1";
                mysql.query(query, [], function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            /**
             * Update value by key
             * @param config
             */
            function updateById(config_value,id) {
                var deferred = $q.defer();
                var query = "UPDATE config SET config_value = ? WHERE id = ?";
                mysql.query(query, [config_value, id], function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }


            /**
             * Update value by key
             * @param config
             */
            function update(config) {
                var deferred = $q.defer();
                var query = "UPDATE config SET config_value = ? WHERE config_key = ?";
                mysql.query(query, [config.config_value, config.config_key], function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }


            /**
             * Get page session time out
             * @return {number}
             */
            function getPageSessionTime() {
                // console.log($rootScope.config);
                if ($rootScope.config) {
                    return $rootScope.config.page_timeout || 20000;
                } else {
                    return 20000;
                }
            }

			function getNetworkTimeout() {
                return 5000;
            }
            /**
             * Get heartbeat time out time
             * @return {number}
             */
            function getHeartbeatTimeout() {
                return $rootScope.config.heartbeat_interval || 20000;
            }

            function getRestartTime() {
                var time_earlier = 2;
                var default_restart_rule = '0 3 * * *';
                return getConfigBykey('maintenance_time_to').then(function (res) {
                    if(res.length > 0) {
                        var maintenance_time_to = res[0].config_value;
                        if(maintenance_time_to) {
                            var to_time_array = maintenance_time_to.split(':');
                            var hour_count = 0;
                            var minute_count = 0;
                            if(to_time_array.length > 1) {
                                hour_count = to_time_array[0];
                                minute_count = to_time_array[1];
                            }
                            var restart_hour_raw = parseInt(hour_count) - time_earlier;
                            var restart_hour = parseInt(restart_hour_raw);
                            if(parseInt(restart_hour_raw) < 0) {
                                restart_hour = 24 + parseInt(restart_hour_raw);
                            }
                            var restart_minute = minute_count;
                            default_restart_rule = restart_minute + " " + restart_hour + " * * *";
                        }
                    }
                    return default_restart_rule;
                }, function() {
                    return default_restart_rule;
                });
            }

            /**
             * Get Analytics time out time
             * @return {number}
             */
            function getAnalyticsTimeout() {
                return $rootScope.config.analytics_timeout || 20000;
            }

            /**
             * Get Log time out time
             * @return {number}
             */
            function getLogTimeout() {
                return $rootScope.config.log_timeout || 20000;
            }

            /**
             * Get screenMedia time out time
             * @return {number}
             */
            function getscreenMediaTimeout() {
                //@Todo move to getConfigBykey
                var sessionTimeout = 5000;
                return sessionTimeout;

            }

            function apiRequest () {
                return $http.post(baseUrl+'/get-configurations');
            }

            function encrypt(text){
                var cipher = crypto.createCipher(algorithm,salt);
                var crypted = cipher.update(text,'utf8','hex');
                crypted += cipher.final('hex');
                return crypted;
            }

            function decrypt(text){
                var decipher = crypto.createDecipher(algorithm,salt);
                var dec = decipher.update(text,'hex','utf8');
                dec += decipher.final('utf8');
                return dec;
            }

            function isVisibleQrCode() {
                if ($rootScope.config.show_qr_code == 1){
                    return true;
                }else{
                    return false;
                }
            }

            function isVisiblePrice() {
                if ($rootScope.config.show_product_price == 1){
                    return true;
                }else{
                    return false;
                }
            }

        }]);


})();