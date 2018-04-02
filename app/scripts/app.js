'use strict';

/**
 * @ngdoc overview
 * @name usxsApp
 * @description
 * # usxsApp
 *
 * Main module of the application.
 */

var _templateBase = './scripts';
var fs = require('fs');
var mysqlClient = require('mysql');
const baseUrl = 'http://usxs.eglobeits.com/api/v1';
const path = require('path');
const remote = require('electron').remote;
const app = remote.app;
// var appPath = app.getPath('appData');
var appPath =  app.getPath('userData');
var dir = path.join(appPath, 'assets');
var createdir = path.join(appPath, 'assets');
const bcrypt = require('bcrypt-nodejs');
const saltRounds = 10;
const crypto = require('crypto');
var ipc = require('electron').ipcRenderer;

// Creates MySql database connection
var HOST = 'localhost';
var mysql;
var noNetworkErrorMessage = "Sorry...Network issue. Please try again after some time";
angular
    .module('usxsApp', [
        'ngAnimate',
        'ngCookies',
        'ui.router',
        'ngSanitize',
        'ngTouch',
        'ui.bootstrap',

        'usxs.controllers',
        'usxs.directives',
        'usxs.factory',
        'usxs.services',
        'usxs.filters',
        'monospaced.qrcode'
    ])

    .run(['$rootScope', 'ConfigService', '$timeout', '$transitions', 'AnalyticsService', 'appService', '$window', '$uibModalStack', 'LogService', function ($rootScope, ConfigService, $timeout, $transitions, AnalyticsService, appService, $window, $uibModalStack, LogService) {
        $rootScope.callbacks = [];
        $rootScope.dbCallback = [];
        LogService.success({'event':'app','log':'turn on screen'});
        ipc.on('log-message', function(event, triggerType, triggerData) {
            LogService.info({'event':'app-auto-update','log':triggerData});
        });
        $rootScope.online = navigator.onLine;
        $rootScope.popUp = false;
        $window.addEventListener("offline", function () {
            $rootScope.online = false;
            appService.stop();
            LogService.info({'event':'network','log':'offline'});
            // $rootScope.$apply(function () {
                $rootScope.networkTimeout = $timeout(function () {
                    //$state.go('usxs.' + localStorage.device_type);
                }, ConfigService.getNetworkTimeout());

            // });
        }, false);
        $window.addEventListener("online", function () {
            // $rootScope.$apply(function () {
                $timeout(function () {
                    if ($rootScope.networkTimeout) {
                        $timeout.cancel($rootScope.networkTimeout);
                    }
                    $rootScope.online = true;
                    appService.start();
                    LogService.success({'event':'network','log':'online'});
                    // if($state.current.name === "usxs.screen") {
                    //     MotionDetectService.start();
                    // }
                }, 500);

            // });
        }, false);

        $transitions.onStart({}, function ($transitions) {
            $uibModalStack.dismissAll();
        });
        $transitions.onSuccess({to: 'usxs.screen.**'}, function ($transitions) {
            AnalyticsService.savePageEvent($transitions.to().title, $transitions.params());
            $rootScope.loaderStatus = false;

            appService.getClientLogo().then(function (res) {
                if(res.length > 0) $rootScope.clientLogo = res[0].screen_media_path;
            });

        });


    }])

    .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', '$httpProvider', '$sceDelegateProvider', '$compileProvider', function ($stateProvider, $locationProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider, $compileProvider) {
        $locationProvider.hashPrefix('');
        $compileProvider.commentDirectivesEnabled(false);
        $compileProvider.cssClassDirectivesEnabled(false);

        $urlRouterProvider.otherwise(localStorage.device_type ? '/' + localStorage.device_type : '/login');

        var mainState = {
            name: 'usxs',
            url: '',
            abstract: true,
            controller: 'MainController',
            templateUrl: 'views/app.html',
            resolve:
                {
                    init: ['$state', 'appService', 'LogService', '$q', function ($state, appService, LogService, $q) {
                        return appService.initSetup().then(function () {
                            LogService.success({'event':'app','log':'screen started'});
                            return appService.start();
                        }, function (err) {
                            LogService.error({'event':'app','log':err});
                            return appService.start();
                        });
                    }]
                }

        };

        var screenState = {
            name: 'usxs.screen',
            url: '/screen',
            title: 'welcome video',
            views: {
                '@usxs': {
                    templateUrl: 'views/screen/welcome.html',
                    controller: 'ScreenController',
                    controllerAs: 'screen'
                }
            },
            resolve: {
                WelcomeVideos: ['$q', '$rootScope', 'ScreenServices',function ($q, $rootScope, ScreenServices) {
                    var deferred = $q.defer();
                    if (mysql) {
                        ScreenServices.getWelcomeVideos().then(function (res) {
                            if (res.length > 0) {
                                angular.forEach(res, function (value,key) {
                                    if (value.screen_media_option == "promotional") {
                                        $rootScope.promotionalVideo = value.screen_media_path;
                                    } else {
                                        $rootScope.welcomeVideo = value.screen_media_path;
                                    }
                                });
                                deferred.resolve();
                            } else {
                                deferred.reject();
                            }
                        }, function () {
                            deferred.reject();
                        });
                    }
                    return deferred.promise
                }]
            }

        };

        var loginState = {
            name: 'login',
            url: '/login',
            title: 'login',
            templateUrl: 'views/login.html',
            controller: 'LoginController',
            controllerAs: 'loginCtrl'

        };

        var LanguageState = {
            name: 'usxs.screen.language',
            url: '/language',
            title: 'language home',
            views: {
                '@usxs': {
                    templateUrl: 'views/screen/product/languages.html',
                    controller: 'LanguageController',
                    controllerAs: 'languageCtrl'
                }
            },
            resolve: {
                backgroundVideo: ['$q', 'LanguageService', function ($q, LanguageService) {
                    var deferred = $q.defer();
                    LanguageService.getBackgroundVideo().then(function (res) {
                        if (res.length > 0) {
                            deferred.resolve(res);
                        } else {
                            deferred.reject();
                        }
                    }, function () {
                        deferred.reject();
                    });
                    return deferred.promise
                }]
            }

        };

        var productsCategoryState = {
            name: 'usxs.screen.category',
            url: '/category',
            title: 'category home',
            views: {
                '@usxs': {
                    templateUrl: 'views/screen/product/category.html',
                    controller: 'CategoryContoller',
                    controllerAs: 'catCtrl'
                }
            },
            resolve: {
                backgroundVideo: ['$q', 'CategoryService',function ($q, CategoryService) {
                    var deferred = $q.defer();
                    CategoryService.getBackgroundVideo().then(function (res) {
                        if (res.length > 0) {
                            deferred.resolve(res[0].screen_media_path);
                        } else {
                            deferred.reject();
                        }
                    }, function () {
                        deferred.reject();
                    });
                    return deferred.promise;
                }],

                categoryItems: ['$q', 'CategoryService', '$stateParams', '$rootScope', function ($q, CategoryService, $stateParams, $rootScope) {
                    var deferred = $q.defer();
                    CategoryService.getCategory().then(function (res) {
                        if (res.data.status == 'success' && Object.keys(res.data.data).length > 0) {
                            deferred.resolve(res.data.data);
                        } else {
                            $rootScope.openModal404("Sorry... no category available");
                            deferred.reject("Sorry... no category available");
                        }
                    }, function () {
                        $rootScope.openModal404(noNetworkErrorMessage);
                        deferred.reject();
                    });
                    return deferred.promise;
                }]
            }

        };

        var productsSubCategoryState = {
            name: 'usxs.screen.category.subcategory',
            url: '/:category_name/:category_id',
            title: 'sub category home',
            views: {
                '@usxs': {
                    templateUrl: 'views/screen/product/subcategory.html',
                    controller: 'SubCategoryController',
                    controllerAs: 'subCatCtrl'
                }
            }

        };

        var productsState = {
            name: 'usxs.screen.category.subcategory.products',
            url: '/:sub_category_name/:sub_category_id',
            title: 'product listing',
            views: {
                '@usxs': {
                    templateUrl: 'views/screen/product/products.html',
                    controller: 'ProductsController',
                    controllerAs: 'prodCtrl'
                }
            },
            resolve: {
                proudctList: ['$q', 'ProductService', '$stateParams', '$rootScope', function ($q, ProductService, $stateParams, $rootScope) {
                    var deferred = $q.defer();
                    var categoryId = $stateParams.sub_category_id || $stateParams.category_id
                    ProductService.getProducts(categoryId).then(function (res) {
                        if ((res.data.data.length > 0) && (res.data.status == 'success')) {
                            deferred.resolve(res.data.data);
                        } else {
                            $rootScope.openModal404("Sorry...no products available");
                            deferred.reject();
                        }
                    }, function () {
                        $rootScope.openModal404(noNetworkErrorMessage);
                        deferred.reject();
                    });
                    return deferred.promise
                }]

            }

        };

        var productsPopupVideoState = {
            name: 'usxs.screen.category.subcategory.products.popupVideo',
            url: '/video/:product_id',
            title: 'product video',
            onEnter: ['$uibModal', '$rootScope', 'video', '$state', function ($uibModal, $rootScope, video, $state) {
                var productVideoUrl = video[0].product_media_url;
                var productVideo = video[0].product_media_path;

                $rootScope.currentModal = $uibModal.open({
                    backdrop: 'static',
                    templateUrl: 'views/screen/product/popup-video.html',
                    controller: ['$scope', 'productVideo', 'productVideoUrl', function ($scope, productVideo, productVideoUrl) {
                        $scope.productVideo = productVideo;
                        $scope.$parent.isModalOpen = true;
                        $scope.QRCodeData = {
                            'type': 'DOWNLOAD_VIDEO',
                            'url': productVideoUrl,
                            'user_token': $rootScope.userToken,
                            'device_id': localStorage.device_id,
                            'device_type': localStorage.device_type
                        };
                    }],
                    resolve: {
                        productVideo: function () {
                            return productVideo;
                        },
                        productVideoUrl: function () {
                            return productVideoUrl;
                        }
                    }
                }).result.then(function(){}, function(res){
                    $rootScope.isModalOpen = false;
                    //$state.go('^');
                });
            }],
            /*onExit: function ($rootScope) {
                $rootScope.currentModal.dismiss('cancel');
            },*/
            resolve: {
                video: ['$q', 'ProductService', '$stateParams', function ($q, ProductService, $stateParams) {

                    var deferred = $q.defer();
                    ProductService.getProductVideo($stateParams.product_id).then(function (res) {
                        if (res.length > 0) {
                            deferred.resolve(res);
                        } else {
                            deferred.reject();
                        }
                    }, function () {
                        deferred.reject();
                    });
                    return deferred.promise;
                }]

            }

        };

        var productsViewState = {
            name: 'usxs.screen.category.subcategory.products.details',
            url: '/details/:product_id',
            title: 'product details',
            views: {
                '@usxs': {
                    templateUrl: 'views/screen/product/product-details.html',
                    controller: 'ProductDetailsController',
                    controllerAs: 'prodDetCtrl'
                }
            },
            resolve: {
                proudctDetails: ['$q', 'ProductService', '$stateParams', '$rootScope', function ($q, ProductService, $stateParams, $rootScope) {
                    var deferred = $q.defer();
                    ProductService.getProductById($stateParams.product_id).then(function (res) {
                        if (res) {
                            $rootScope.popUp = false;
                            deferred.resolve(res);
                        } else {
                            $rootScope.popUp = true;
                            deferred.reject();
                        }
                    }, function () {
                        $rootScope.popUp = true;
                        deferred.reject();
                    });
                    return deferred.promise;
                }]

            }

        };

        var offlineState = {
            name: 'usxs.screen.offline',
            url: '/offline',
            title: 'Off line',
            views: {
                'offline': {
                    templateUrl: 'views/screen/offline.html',
                    controller: 'OfflineController',
                    controllerAs: 'offlineCtrl'
                }
            }
        };

        var pagenotfoundState = {
            name: 'usxs.screen.pagenotfound',
            url: '/pagenotfound',
            title: 'page not found',
            views: {
                'pagenotfound': {
                    templateUrl: 'views/screen/404.html',
                    controller: 'PagenotFoundController',
                    controllerAs: 'pagenotfound'
                }
            }

        };

        $stateProvider.state(mainState);
        $stateProvider.state(loginState);
        $stateProvider.state(screenState);
        $stateProvider.state(LanguageState);
        $stateProvider.state(productsCategoryState);
        $stateProvider.state(productsSubCategoryState);
        $stateProvider.state(productsState);
        $stateProvider.state(productsViewState);
        $stateProvider.state(productsPopupVideoState);
        $stateProvider.state(offlineState);
        $stateProvider.state(pagenotfoundState);

        $sceDelegateProvider.resourceUrlWhitelist([
            // Allow same origin resource loads.
            'self',
            // Allow loading from our assets domain.  Notice the difference between * and **.
            'https://embed.wirewax.com/**'
        ]);

        $httpProvider.interceptors.push(['$q', '$injector', '$state', function ($q, $injector, $state) {
            return {
                'request': function (config) {
                    config.headers = config.headers || {};
                    config.data = config.data || {};
                    if (localStorage.token) {
                        config.headers.Authorization = 'Bearer ' + localStorage.token;
                        config.data.token = localStorage.token;
                    }
                    if (localStorage.locale) {
                        config.data.locale = localStorage.locale;
                    }
                    return config;
                },
                'responseError': function (response) {
                    var LogService = $injector.get('LogService');
                    LogService.error({'event':'api','log':(response.data ? response.data.message : response.status),'trace':response.config.url});
                    if ((response.status === 401 || response.status === 403) && response.data.message != 'Invalid username or password') {
                        var AuthService = $injector.get('AuthService');
                        var ConfigService = $injector.get('ConfigService');
                        var $http = $injector.get('$http');
                        var deferred = $q.defer();
                        var loginCedentials = {};

                        ConfigService.getLoginCredentials().then(function (res) {
                            if (res.password && res.username) {
                                loginCedentials = {
                                    'username': res.username,
                                    'password': res.password
                                };
                                deferred.resolve(loginCedentials);
                            } else {
                                $state.go('login');
                            }

                        }, function () {
                            $state.go('login');
                        });

                        var deferredSignin = $q.defer();
                        deferred.promise.then(function (res) {
                            AuthService.signin(res).then(function (res) {
                                if (res.data.status === 'success') {
                                    localStorage.token = res.data._token;

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


                                    deferredSignin.resolve();
                                } else {
                                    $state.go('login');
                                }
                            }, function () {
                                $state.go('login');
                            });
                        });

                        return deferredSignin.promise.then(function () {
                            return $http(response.config);
                        });


                    }
                    return $q.reject(response);
                }
            };
        }]);

    }])

/*.config(function($provide) {
    $provide.decorator('$exceptionHandler', ['$log', '$delegate', '$injector',
        function($log, $delegate, $injector) {
            return function(exception, cause) {
                $log.debug('Default exception handler.');
                $log.debug(exception);
                $delegate(exception, cause);
            };
        }
    ]);
})*/;
