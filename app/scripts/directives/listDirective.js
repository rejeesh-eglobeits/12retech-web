angular.module('usxsApp')

    .directive('popupVideo', ['$compile',function ($compile) {
        return {
            restrict: 'E',
            scope: {productVideo: '='},
            template: '<video autoplay loop style="width: 100%; height: auto;" ><source ng-src="{{productVideo}}" type="video/mp4"></video>',
            link: function (scope, el, attr) {
            }
        };
    }]);