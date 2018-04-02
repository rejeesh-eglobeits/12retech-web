(function () {
    'use strict';
    /**
     * @ngdoc function
     * @name usxsApp.controller:ProductsController
     * @description
     * # AboutCtrl
     * Controller of the usxsApp
     */
    angular.module('usxsApp')
        .controller('ProductsController', ['ProductService','AnalyticsService','$stateParams','$scope', function (ProductService,AnalyticsService,$stateParams,$scope) {
            var self = this;
            self.categoryId = $stateParams.sub_category_id || $stateParams.category_id
            self.categoryName = $stateParams.sub_category_name || $stateParams.category_name
            self.proudctList = $scope.$resolve.proudctList;

            self.trustUrl = function (url) {
                return ProductService.getUrl(url);
            };

            ProductService.getBackgroundImage().then(function (res) {
                self.background =res[0].screen_media_path.replace(/\\/g,"/");
            });

        }]);

})();