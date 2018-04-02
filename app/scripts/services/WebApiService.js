var ipc = require('electron').ipcRenderer;
(function () {
    'use strict';

    angular.module('usxsApp')
        .service('WebApiService', ['$q', '$http', '$rootScope', '$timeout', 'ScreenServices', 'LanguageService', 'ProductService' ,'ConfigService', 'DeleteService', function ($q, $http, $rootScope, $timeout, ScreenServices, LanguageService, ProductService, ConfigService,DeleteService) {

            return {
                processHeartBeat: processHeartBeat,
                processScreenMediaDownload: processScreenMediaDownload
            }

            function processHeartBeat() {
                if (!localStorage.initSetup) {
                    $http.post(baseUrl + '/heartbeat').then(function (res) {
                        $timeout(function () {
                            if($rootScope.callbacks.length > 0){
                                angular.forEach($rootScope.callbacks, function (value, key) {
                                    value.callback();
                                });
                                $rootScope.callbacks = [];
                            }
                        }, ConfigService.getHeartbeatTimeout());


                        if (res.data.status == 'success' && res.data.pending_sync.length > 0) {
                            angular.forEach(res.data.pending_sync, function (value, key) {
                                if (value.tag == 'get-product-list' || value.tag == 'get-product') {
                                     updateProductsList(value);
                                }

                                if (value.tag == 'get-languages-of-screen') {
                                    updatedLanguages(value.data);
                                }

                                if (value.tag == 'get-screen-content') {
                                    processScreenMediaDownload();
                                }

                                if (value.tag == 'get-configurations') {
                                   ConfigService.syncConfig();
                                }

                                if (value.tag === 'restart-screen') {
                                    ipc.send('restart-now',true);
                                }

                            });
                        }
                    });
                }

                if ($rootScope.heartBeatTOout) $timeout.cancel($rootScope.heartBeatTOout);
                $rootScope.heartBeatTOout = $timeout(function () {
                    processHeartBeat();
                }, ConfigService.getHeartbeatTimeout());

            }


            function updateProductsList(data) {
                    if (data.deleted) {
                        deletedProducts(data.deleted);
                    }

                    if (data.updated) {
                        syncProducts(data.updated);
                    }

                    if (data.added) {
                        syncProducts(data.added);
                    }


            }

            function deletedProducts(deletedProducts) {
                angular.forEach(deletedProducts, function (value, key) {
                    ProductService.deleteProductMediaByProductId(value);
                });

            }

            function syncProducts(products) {
                ProductService.syncProductsListMedia(products).then(function (res) {
                    ProductService.downloadMedia().then(function () {
                        while ($rootScope.deleteMediaFile.length > 0 ){
                            var file = $rootScope.deleteMediaFile.shift();
                            DeleteService.deleteFile(file).then(function (file) {
                                LogService.success({'event': 'delete product media', 'log': 'deleted', 'trace': file});
                            },function (err) {
                                LogService.success({'event': 'delete product media', 'log': err});
                            });
                        }
                    });
                });
            }

            function processScreenMediaDownload() {
                ScreenServices.syncScreenVideos().then(function (res) {
                    ScreenServices.downloadMedia().then(function () {
                        while ($rootScope.deleteScreenMediaFile.length > 0 ){
                            var file = $rootScope.deleteScreenMediaFile.shift();
                            DeleteService.deleteFile(file).then(function (file) {
                                LogService.success({'event': 'delete screen media', 'log': 'deleted', 'trace': file});
                            },function (err) {
                                LogService.success({'event': 'delete screen media', 'log': err});
                            });
                        }
                        ScreenServices.getWelcomeVideos().then(function (res) {
                            if(res.length > 0){
                                angular.forEach(res, function (value,key) {
                                    if (value.screen_media_option == "promotional") {
                                        $rootScope.promotionalVideo = value.screen_media_path;
                                    } else {
                                        $rootScope.welcomeVideo = value.screen_media_path;
                                    }
                                });
                            }
                        })
                    });
                });
            }

            function updatedLanguages() {
                LanguageService.getLanguages()
            }

        }]);


})();