angular.module('usxsApp')

    .directive('attachCam', ['ScreenServices', function (ScreenServices) {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {

            }
        };
    }]);