angular.module('usxsApp')

    .directive('categoryFloat', [function () {
        return {
            restrict: 'A',
            link: function (scope, el, attr) {
                el.jqFloat('play',{
                    width:500,
                    height:100,
                    speed:3000

                });

                el.hover(function () {
                    el.jqFloat('stop');
                    //el.addClass('animatestop');
                })

                el.bind('mouseleave', function() {
                    el.jqFloat('play',{
                        width:500,
                        height:100,
                        speed:3000

                    });
                });
                /*scope.$on('$destroy', function() {
                    scope.$destroy();

                });*/
            }
        };
    }]);