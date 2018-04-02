(function () {
    'use strict';


    angular.module('usxsApp')
        .factory('UserService',
            ['$q', '$http', '$rootScope', 'AnalyticsService', function ($q, $http, $rootScope, AnalyticsService) {

            function changeUser(user) {
                angular.extend(currentUser, user);
            }

            function urlBase64Decode(str) {
                var output = str.replace('-', '+').replace('_', '/');
                switch (output.length % 4) {
                    case 0:
                        break;
                    case 2:
                        output += '==';
                        break;
                    case 3:
                        output += '=';
                        break;
                    default:
                        throw 'Illegal base64url string!';
                }
                return window.atob(output);
            }

            function getUserFromToken() {
                var token = localStorage.token;
                var user = {};
                if (typeof token !== 'undefined') {
                    var encoded = token.split('.')[1];
                    user = JSON.parse(urlBase64Decode(encoded));
                }
                return user;
            }

            // var currentUser = getUserFromToken();
            function createToken() {
                var deferred = $q.defer();
                bcrypt.hash(localStorage.token + Date.now(), null, null, function(err, hash) {
                    $rootScope.userToken = hash;
                    deferred.resolve();
                });
                return deferred.promise;
            }

            return {
                login: function () {
                    var deferred = $q.defer();
                    if($rootScope.userToken) {
                        AnalyticsService.saveVisitorsEvent('USER_IN');
                        deferred.resolve();
                    } else {
                        createToken().then(function () {
                            AnalyticsService.saveVisitorsEvent('USER_IN');
                            deferred.resolve();
                        });
                    }
                    return deferred.promise;
                },
                me: function (success, error) {
                    $http.get(baseUrl + '/me').then(success,error);
                },
                logout: function () {
                    //changeUser({});
                    AnalyticsService.saveVisitorsEvent('USER_OUT');
                    // delete $rootScope.userToken;
                },
                authenticate: function (success, error) {
                    var deferred = $q.defer();
                    if (localStorage.token) {
                        deferred.resolve(localStorage.token);
                    } else {
                        deferred.reject();
                    }
                    return deferred.promise;

                },
                createToken:createToken
            };



        }]);


})();