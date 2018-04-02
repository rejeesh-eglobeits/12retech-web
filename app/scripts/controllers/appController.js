'use strict';

angular.module('usxs.controllers', [])

    .controller('MainController', ['$scope', '$rootScope', '$injector', '$uibModal',
        function ($scope, $rootScope, $injector, $uibModal) {
            this.$onInit = function () {
                $scope.$watch(function () {
                    return mysql;
                }, function (newVal, oldVal) {
                    if (!angular.equals(newVal, oldVal)) {
                        var dbCallback,service;
                        while ($rootScope.dbCallback.length > 0 ){
                            dbCallback = $rootScope.dbCallback.shift();
                            service = $injector.get(dbCallback.service);
                            service[dbCallback.method](dbCallback.data);
                        }
                        dbCallback = service = null;
                    }
                });
            };
            $rootScope.loaderStatus = true;
            $scope.token = localStorage.token;

            $rootScope.openModal404 = function (message) {
                if (!message) {
                    message = "Sorry... try again after some time";
                }
                $rootScope.currentModal = $uibModal.open({
                    templateUrl: 'views/screen/404.html',
                    controller: function ($scope) {
                        $scope.message = message;
                    }
                }).result.then(function () {
                }, function (res) {
                });
            };

        }
    ])

    .controller(
        'LoginController',
        [
            '$scope',
            '$rootScope',
            '$state',
            '$timeout',
            'AuthService',
            'appService',
            'ConfigService',
            'DatabaseService',
            'LogService',
            function ($scope,
                      $rootScope,
                      $state,
                      $timeout,
                      AuthService,
                      appService,
                      ConfigService,
                      DatabaseService,
                      LogService) {
                $scope.formData = {
                    'username': '',
                    'password': '',
                    'dbusername': '',
                    'dbpassword': '',
                    'dbname': ''
                }
                DatabaseService.getCredentials().then(function (result) {
                    if (result) {
                        $scope.formData.dbusername = result.user;
                        $scope.formData.dbpassword = result.password;
                        $scope.formData.dbname = result.database;
                    }
                });
                if (mysql !== undefined) {
                    ConfigService.getLoginCredentials().then(function (res) {
                        if (res.password && res.username) {
                            $scope.formData.username = ConfigService.decrypt(res.username);
                        }
                    });
                }
                $scope.loginBusy = false;
                $rootScope.loaderStatus = false;
                $scope.signin = function () {
                    $scope.loginBusy = true;
                    AuthService.signin($scope.formData).then(function (res) {
                        $scope.errorStatus = res.data.status;
                        $scope.errorMessage = res.data.message;
                        if (res.data.status === 'success') {
                            LogService.success({'event': 'setup', 'log': 'screen login: success'});
                            $rootScope.loaderStatus = true;
                            localStorage.token = res.data._token;
                            localStorage.device_type = res.data.device_type;
                            localStorage.device_id = res.data.device_id;
                            localStorage.dbname = $scope.formData.dbname;

                            //create connection
                            var dbConfig = {
                                user: $scope.formData.dbusername,
                                password: $scope.formData.dbpassword,
                                database: localStorage.dbname
                            }
                            DatabaseService.createConnection(dbConfig).then(function () {
                                LogService.success({'event': 'setup', 'log': 'database connection: success'});
                                DatabaseService.saveCredentials(dbConfig).then(function () {
                                    LogService.success({'event': 'setup', 'log': 'db credentials saved'});
                                    LogService.success({'event': 'setup', 'log': 'initial setup started'});
                                    return appService.initSetup().then(function () {
                                        LogService.success({'event': 'setup', 'log': 'initial setup completed'});
                                        var config = {
                                            'config_key': 'username',
                                            'config_value': $scope.formData.username
                                        };
                                        ConfigService.save(config);
                                        var config = {
                                            'config_key': 'password',
                                            'config_value': $scope.formData.password
                                        };
                                        ConfigService.save(config);

                                        angular.forEach(res.data, function (value, key) {
                                            if (key !== 'message') {
                                                if (key === '_token') {
                                                    var config = {
                                                        'config_key': 'token',
                                                        'config_value': value
                                                    };
                                                } else {
                                                    var config = {
                                                        'config_key': key,
                                                        'config_value': value
                                                    };
                                                }
                                                ConfigService.save(config);
                                            }

                                        });


                                        $scope.loginBusy = false;
                                        appService.start();
                                        $state.go('usxs.' + localStorage.device_type);
                                    }, function (err) {
                                        LogService.error({'event': 'setup', 'log': err});
                                        $scope.loginBusy = $rootScope.loaderStatus = false;
                                        $scope.errorStatus = 'error';
                                        $scope.errorMessage = "Network issue please try again later.";
                                        console.log('initSetup failed')
                                        console.log(err)
                                        // localStorage.removeItem('token');
                                        // $state.go('login');
                                    });
                                }, function (err) {
                                    LogService.error({'event': 'setup', 'log': err});
                                });


                            }, function (err) {
                                console.log(err)
                                LogService.error({'event': 'setup', 'log': err});
                                $scope.loginBusy = false;
                                $rootScope.loaderStatus = false;
                                $scope.errorStatus = 'error';
                                $scope.errorMessage = err;
                            });


                        } else {
                            LogService.error({'event': 'setup', 'log': 'screen login: ' + res.data.message});
                        }

                    }, function (err) {
                        LogService.error({'event': 'api', 'log': err});
                        $scope.loginBusy = false;
                        $rootScope.loaderStatus = false;
                        $scope.errorStatus = err.data.status;
                        $scope.errorMessage = err.data.message;
                    });
                };

            }]);