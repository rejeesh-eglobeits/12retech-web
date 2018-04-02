(function () {
    'use strict';


    angular.module('usxsApp')
        .factory('AuthService',
            ['$q', '$http', function ($q, $http) {

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

            return {
                signin: function (data) {
                    return $http.post(baseUrl + '/authenticate', data);
                },
                me: function (success, error) {
                    $http.get(baseUrl + '/me').then(success,error);
                },
                logout: function (success) {
                    changeUser({});
                    delete localStorage.token;
                    success();
                },
                authenticate: function (success, error) {
                    var deferred = $q.defer();
                    if (localStorage.token) {
                        deferred.resolve(localStorage.token);
                    } else {
                        deferred.reject();
                    }
                    return deferred.promise;

                }
            };



        }]);


})();