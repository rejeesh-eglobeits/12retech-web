angular.module('usxs.directives', [])
    .directive('welcomeScreen', ['UserService', '$state', '$timeout', 'ConfigService','MotionDetectService', 'AnalyticsService',  function ( UserService, $state, $timeout, ConfigService, MotionDetectService, AnalyticsService) {
        return {
            restrict: 'E',
            scope: {promotionalVideo: '=', welcomeVideo: '=', onClick: '&'},
            template: '<div class="webcam-demostatus" style="font-weight: bolder; font-size: larger; color: #8a6d3b;text-align: center"><img alt="No Face" class="camera-detection-icon" src="images/no-camera-icon.png"></div><video loop autoplay="autoplay" preload="auto"  ng-click="onClick()" style="width: 100%;"><source ng-src="{{promotionalVideo}}" type="video/mp4" ></video>',
            link: ['scope', 'el', 'attr', function (scope, el, attr) {
                $video = el.children().eq(1);
                $cam_status = el.children()[0];
                MotionDetectService.start();



                scope.$watch(function () {
                    return MotionDetectService.motionStatus;
                }, function (newVal, oldVal) {
                    if (newVal === 'In') {
                        $video.prop({"src": scope.welcomeVideo, "loop": false});
                        /* $cam_status.innerHTML = 'Face Detected'; */
                        $cam_status.innerHTML = '<img alt="Face Detected" class="camera-detection-icon" src="images/camera-icon.png">';
                    }
                    if (!angular.equals(newVal, oldVal)) {
                        if (newVal === 'In') {
                            UserService.login().then(function () {
                                AnalyticsService.savePageEvent('welcome video');
                            });
                        } else if (newVal === 'Out') {
                            /*$timeout(function() {
                                $state.go('usxs.screen');
                                $video.src = scope.promotionalVideo;
                                $video.loop = true;
                                AnalyticsService.saveVisitorsEvent('USER_OUT');
                            }, ConfigService.getPageTimeout());*/
                            $state.go('usxs.screen');
                            $video.prop({"src":scope.promotionalVideo, "loop": true});
                            UserService.logout();
                            /* $cam_status.innerHTML = 'No Face'; */
                            $cam_status.innerHTML = '<img alt="No Face" class="camera-detection-icon" src="images/no-camera-icon.png">';
                        }
                    }

                });

                $video.on('ended', function(){
                    if (MotionDetectService.motionStatus == 'In') {
                        MotionDetectService.pageTimeOut();
                        $state.go('usxs.screen.language');
                    } else {
                        $state.go('usxs.screen');
                        $video.prop({"src":scope.promotionalVideo, "loop": true});
                        restart();
                    }
                });


                function vidplay() {
                    $video.play();
                }

                function vidpause() {
                    $video.pause();
                }

                function restart() {
                    $video.prop({"currentTime":0});
                }

                function skip(value) {
                    $video.currentTime += value;
                }

                scope.$on('$destroy', function () {
                    // $video = null;
                    MotionDetectService.stop();
                });

            }]
        };
    }])

    .directive('offlineModel', [function () {
        return {
            restrict: 'A',
            scope: {offlineModel: '='},
            link: ['scope', 'el', 'attr', function (scope, el, attr) {
                scope.$watch(function () {
                    return scope.offlineModel
                }, function (newVal) {
                    if (newVal == false) {
                        el.modal('show');
                    } else {
                        el.modal('hide');
                    }

                })

                scope.$on('$destroy', function () {
                    el.modal('hide')
                    el.modal('dispose');
                });


            }]
        };
    }])

    .directive('captureClicks', ['MotionDetectService', function (MotionDetectService) {
        return {
            restrict: 'A',
            link: ['scope', 'el', 'attr', function (scope, el, attr) {
                el.click(function () {
                    MotionDetectService.pageTimeOut();
                });


            }]
        };
    }]);
