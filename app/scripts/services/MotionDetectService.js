(function () {
    'use strict';


    angular.module('usxsApp')
        .service('MotionDetectService', ['$timeout', '$interval', '$state', '$rootScope', 'ConfigService', 'UserService', function ($timeout, $interval, $state, $rootScope, ConfigService, UserService) {
            var self = this;

            var in_threshold = 1;
            var out_threshold = 8;
            var video_play_tcount = 0;
            var video_pause_tcount = 0;
            self.video_play_status = 0;
            var video_exit_status = 0;



            var tracker = new tracking.ObjectTracker(['face']);
            tracker.setInitialScale(4);
            tracker.setStepSize(2);
            tracker.setEdgesDensity(0.1);
            tracking.Frames.setFrameDelay(20);

            var camdemo = document.createElement('video');
            camdemo.width = 640;
            camdemo.height = 480;
            camdemo.autoplay = true;
            camdemo.muted = true;

            self.motionStatus = "Out";
            self.start = function () {
                if(localStorage.initSetup){
                    return false;
                }
                self.trakingTrack = tracking.track(camdemo, tracker, {camera: true});
            };

            self.stop = function () {
                if(typeof self.trakingTrack !== 'undefined') self.trakingTrack.stop();
                tracking.stopUserMedia();
            };


            tracker.on('track', function (event) {

                if (event.data.length > 0) {
                    video_pause_tcount = 0;
                    video_play_tcount++;
                } else {
                    video_play_tcount = 0;
                    video_pause_tcount++;
                }

                if (video_play_tcount > in_threshold) {
                    self.video_play_status = 1;
                    video_play_tcount = 0;
                } else if (video_pause_tcount > out_threshold) {
                    self.video_play_status = 0;
                    video_pause_tcount = 0;
                }

                if ((self.video_play_status === 1) && (video_exit_status === 0) && self.motionStatus !== "In") {
                    $rootScope.$apply(function () {
                        self.motionStatus = "In";
                        $rootScope.userInEvent = 'USER_IN';
                    });

                    // console.log('in');
                }

                if (self.video_play_status == 0 && self.motionStatus !== "Out") {
                    $rootScope.$apply(function () {
                        self.motionStatus = "Out";
                    });
                    // console.log('out');
                }

            });

            self.pageTimeOut = function () {
                if ($rootScope.pageTimeout) {
                    self.stop();
                    $interval.cancel($rootScope.pageTimeout);
                }
                if ($rootScope.camTimeout) {
                    $timeout.cancel($rootScope.camTimeout);
                }
                // $rootScope.$$watchers = [];
                // $rootScope.$$watchersCount = 0;

                $rootScope.pageTimeout = $interval(function () {
                    if ($state.current.name === 'login' || $state.current.name === 'usxs.screen'){
                        return false;
                    }
                    
                    if($rootScope.loaderStatus) return false;
                    self.start();
                    if ($rootScope.camTimeout) {
                        $timeout.cancel($rootScope.camTimeout);
                    }
                    $rootScope.camTimeout = $timeout(function () {
                        if(self.motionStatus == 'Out'){
                            if ($rootScope.pageTimeout) {
                                $interval.cancel($rootScope.pageTimeout);
                            }
                            UserService.logout();
                            $state.go('usxs.screen');
                        }
                        self.stop();
                    },5000);

                }, ConfigService.getPageTimeout());

            };

            return self;

        }]);


})();