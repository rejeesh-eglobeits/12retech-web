angular.module('usxsApp')

    .directive('jcarouselThumbs', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            scope: {
                images: "=",
                targetCarousel: "="
            },
            templateUrl: 'views/screen/product/jcarousel-thumbs.html',
            link: function (scope, el, attr) {
                var container = angular.element(el);
                var carousel = container.children('.jcarousel');
                scope.$watch(scope.images, function (value) {
                    carousel.jcarousel();

                    scope.$watch(function () {
                        return scope.targetCarousel;
                    }, function (targetCarousel) {
                        if (targetCarousel != '') {
                            carousel.jcarousel('items').each(function () {
                                var item = angular.element(this);
                                item
                                    .on('jcarouselcontrol:active', function () {
                                        carousel.jcarousel('scrollIntoView', this);
                                        item.addClass('active');
                                    })
                                    .on('jcarouselcontrol:inactive', function () {
                                        item.removeClass('active');
                                    })
                                    .jcarouselControl({
                                        target: targetCarousel.jcarousel('items').eq(item.index()),
                                        carousel: targetCarousel
                                    });
                            });
                        }
                    });
                    container.children('.prev')
                        .on('jcarouselcontrol:inactive', function () {
                            angular.element(this).addClass('inactive');
                        })
                        .on('jcarouselcontrol:active', function () {
                            angular.element(this).removeClass('inactive');
                        })
                        .jcarouselControl({
                            target: '-=1'
                        });

                    container.children('.next')
                        .on('jcarouselcontrol:inactive', function () {
                            angular.element(this).addClass('inactive');
                        })
                        .on('jcarouselcontrol:active', function () {
                            angular.element(this).removeClass('inactive');
                        })
                        .jcarouselControl({
                            target: '+=1'
                        });
                });


                /*scope.$watch(scope.index, function (value) {
                    carousel.jcarousel('items').eq(value);
                });*/


                scope.$on('$destroy', function () {
                    carousel.jcarousel('destroy');
                });

            }
        };
    }])

    .directive('jcarousel', [function () {
        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            scope: {
                images: "=",
                connectedCarousel: "="
            },
            templateUrl: 'views/screen/product/jcarousel.html',
            link: function (scope, el, attr) {
                var container = angular.element(el);
                scope.connectedCarousel = container.children('.jcarousel');
                scope.$watch(scope.images, function (value) {
                    scope.connectedCarousel.jcarousel();

                });

                scope.$on('$destroy', function () {
                    scope.connectedCarousel.jcarousel('destroy');
                });

            }
        };
    }]);