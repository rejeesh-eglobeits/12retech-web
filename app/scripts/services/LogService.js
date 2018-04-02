(function () {
    'use strict';

    angular.module('usxsApp')
        .service('LogService', ['$q', '$http', '$filter', '$state', '$rootScope', '$timeout', 'ConfigService', function ($q, $http, $filter, $state, $rootScope, $timeout, ConfigService) {
            var tableName = 'log';
            return {
                success: success,
                info: info,
                error: error,
                create: create,
                update: update,
                sendLog: sendLog,
                deleteLog: deleteLog
            };

            /**
             * info log
             * @param log
             */
            function success(log) {
                var data = {
                    'type': 'SUCCESS'
                };

                log = angular.extend(data, log);

                return create(log);
            }

            /**
             * info log
             * @param log
             */
            function info(log) {
                var data = {
                    'type': 'INFO'
                };

                log = angular.extend(data, log);

                return create(log);
            }

            /**
             * error log
             * @param log
             */
            function error(log) {
                var trace = Error().stack.split("\n");
                trace.splice(0,3);
                trace = trace.map(function(s) { return s.trim(); });

                var data = {
                    'type': 'ERROR',
                    'trace':trace.join(',')
                };

                log = angular.extend(data, log);

                return create(log);
            }

            /**
             * create log
             * @param log
             */
            function create(log) {
                var deferred = $q.defer();

                var data = {
                    'type': '',
                    'user_token': $rootScope.userToken || '',
                    'event': 'app',
                    'log':'',
                    'trace':'',
                    'occurred_at': getCurrentTime()
                };

                log = angular.extend(data, log);
                var callback = {
                    'service':'LogService',
                    'method':'create',
                    'data':log
                }

                if(mysql){
                    log = {'log': JSON.stringify(log)};

                    var query = "INSERT INTO "+tableName+" SET ?";
                    mysql.query(query, log, function (err, res) {
                        if (err) {
                            $rootScope.dbCallback.push(callback);
                            deferred.resolve();
                        }
                        if (res) deferred.resolve(res.insertId);
                    });
                } else {
                    $rootScope.dbCallback.push(callback);
                    deferred.resolve();
                }

                return deferred.promise;
            }


            /**
             * Delete Log
             */
            function deleteLog() {
                var deferred = $q.defer();
                var query = "DELETE FROM "+tableName+" WHERE is_transfer = ?";
                mysql.query(query, [1], function (err, res) {
                    if (err) deferred.resolve();
                    deferred.resolve(res);
                });
                return deferred.promise;
            }
            /**
             * Update log
             * @param data
             */
            function update(data) {
                var deferred = $q.defer();
                angular.forEach(data, function (value, key) {
                    var query = "UPDATE "+tableName+" SET is_transfer = ? WHERE id = ?";
                    mysql.query(query, [1, value.id], function (err, res) {
                        if (err) deferred.resolve();
                        deferred.resolve(res);
                    });
                });
                return deferred.promise;
            }

            function getLogs(limit) {
                var deferred = $q.defer();
                var query = "SELECT log, id FROM "+tableName+" WHERE is_transfer = 0 LIMIT ?";
                mysql.query(query,limit , function (err, rows) {
                    if (err) deferred.resolve(err);
                    if (rows) deferred.resolve(rows);
                });
                return deferred.promise;
            }


            function sendLog() {
                var limit = 10;
                getLogs(limit).then(function (res) {
                    if(res.length > 0){
                        var logs = [];
                        var log = {};
                        angular.forEach(res, function (value, key) {
                            log = JSON.parse(value.log);
                            if(angular.isObject(log.log)){
                                log.log = JSON.stringify(log.log);
                            }
                            if(angular.isObject(log.trace)){
                                log.trace = JSON.stringify(log.trace);
                            }
                            logs.push(log);
                        });
                        $http.post(baseUrl + '/screen-logs', {"logs": logs}).then(function (result) {
                            if (result.data.status === "success") {
                                update(res);
                                deleteLog();
                            }

                        });
                    }

                });

                $rootScope.logTOut = $timeout(function () {
                    sendLog();
                }, ConfigService.getLogTimeout());
            }

            function getCurrentTime() {
                /**
                 * @todo
                 *
                 * Format by store's timeZone
                 */
                return $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
            }


        }]);


})();