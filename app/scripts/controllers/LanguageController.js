(function () {
    'use strict';
    /**
     * @ngdoc function
     * @name usxsApp.controller:LanguageController
     * @description
     * # AboutCtrl
     * Controller of the usxsApp
     */
    angular.module('usxsApp')
        .controller('LanguageController', ['$sce', '$stateParams', 'LanguageService', '$scope', '$state', 'MotionDetectService', 'AnalyticsService', function ($sce, $stateParams, LanguageService, $scope, $state, MotionDetectService, AnalyticsService) {

            var self = this;

            self.$onInit = function () {
                MotionDetectService.pageTimeOut();
            };

            angular.forEach($scope.$resolve.backgroundVideo, function (value, key) {
                if (value.screen_media_option == "language_background") {
                    self.backgroundVideo = value.screen_media_path;
                } else if (value.screen_media_option == "language") {
                    self.screenLanguageVideo = value.screen_media_path;
                }
            });

            LanguageService.getScreenLanguages().then(function (res) {
                if (res.length > 0) {
                    self.screenLanguages = res;
                } else {
                    $state.go('usxs.screen');
                }
            }, function () {
                $state.go('usxs.screen');
            });

            self.setLanguage = function (language) {
                localStorage.locale = language;
                AnalyticsService.savePageEvent('language selection',language);
                $state.go('usxs.screen.category');
            };

        }]);

})();


