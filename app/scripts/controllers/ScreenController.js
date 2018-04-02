'use strict';

/**
 * @ngdoc function
 * @name usxsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the usxsApp
 */
angular.module('usxsApp')
    .controller('ScreenController', ['$scope', '$rootScope', '$http', '$state', 'ScreenServices', 'MotionDetectService', 'AnalyticsService', function ($scope, $rootScope, $http, $state, ScreenServices, MotionDetectService, AnalyticsService) {
        var self = this;
        self.$onInit = function () {
            /*if(MotionDetectService.motionStatus === 'In') {
                AnalyticsService.savePageEvent('welcome video');
            }*/
        };

        self.onClick = function () {
            if(MotionDetectService.motionStatus === 'In') {
                AnalyticsService.savePageEvent('welcome video skip');
                $state.go('usxs.screen.language');
            } else {
                $rootScope.userInEvent = 'click promotional video';
                MotionDetectService.video_play_status = 1;
                MotionDetectService.motionStatus = 'In';
            }
        };

        self.motionStatus = 'Out';
    }]);
