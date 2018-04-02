(function () {
    'use strict';

    angular.module('usxsApp')
        .service('AnalyticsService', ['$q','$http','$filter', '$rootScope', '$timeout', 'ConfigService', function ($q,$http,$filter, $rootScope, $timeout, ConfigService) {
            var tableName = 'analytics';
            return {
                create: create,
                saveVisitorsEvent:saveVisitorsEvent,
                savePageEvent:savePageEvent,
                sendAnalytics:sendAnalytics
            };

            function saveVisitorsEvent(event) {
                var data = {
                    'event': event,
                    'user_token': $rootScope.userToken,
                    'page': (event === 'USER_OUT') ? 'session end' : $rootScope.userInEvent,
                    'param':'',
                    'occurred_at': getCurrentTime()
                };
                if(data.user_token) {
                    data = {'event': JSON.stringify(data)};
                    create(data);
                    if(event=='USER_OUT'){
                        delete $rootScope.userToken;
                    }
                }
            }

            function savePageEvent(page, params) {
                if(angular.isObject(params)){
                    var param = params.product_id || params.sub_category_id || params.category_id || '';
                } else if (params) {
                    var param = params;
                } else {
                    var param = '';
                }

                var data = {
                    'event': 'PAGE_VIEW',
                    'user_token': $rootScope.userToken,
                    'page':page,
                    'param':param,
                    'occurred_at': getCurrentTime()
                };

                if(data.user_token) {
                    data = {'event': JSON.stringify(data)};
                    create(data);
                }
            }

            function getCurrentTime() {
                /**
                 * @todo
                 *
                 * Format by store's timeZone
                 */
                return $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');
            }
                
            function sendAnalytics() {
                var limit = 10;
                getAnalytics(limit).then(function (res) {
                    if(res.length > 0){
                      var events = [];
                      angular.forEach(res, function (value, key) {
                          events.push(JSON.parse(value.event));
                      });
                      $http.post(baseUrl + '/log-events', {"events": events}).then(function (result) {
                          if (result.data.status === "success") {
                              update(res);
                              deleteAnalytics();
                          }

                      });
                  }

                });

                $rootScope.analyticsTOut = $timeout(function () {
                    sendAnalytics();
                }, ConfigService.getAnalyticsTimeout());
            }

            function deleteAnalytics() {
                var deferred = $q.defer();
                var query = "DELETE FROM "+tableName+" WHERE is_transfer = ?";
                mysql.query(query, [1], function (err, res) {
                    if (err) deferred.resolve();
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

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


            function getAnalytics(limit) {
                var deferred = $q.defer();
                var query = "SELECT event, id FROM "+tableName+" WHERE is_transfer = 0 LIMIT ?";
                mysql.query(query,limit , function (err, rows) {
                    if (err) deferred.resolve(err);
                    if (rows) deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function create(data) {
                var deferred = $q.defer();
                var query = "INSERT INTO "+tableName+" SET ?";
                mysql.query(query, data, function (err, res) {
                    if (err) deferred.reject(err);
                    if (res) deferred.resolve(res.insertId);
                });
                return deferred.promise;
            }


        }]);


})();