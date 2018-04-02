(function () {
    'use strict';
    /**
     * @ngdoc function
     * @name usxsApp.controller:CategoryContoller
     * @description
     * # AboutCtrl
     * Controller of the usxsApp
     */
    angular.module('usxsApp')
        .controller('CategoryContoller', [ '$sce','$scope','$rootScope','AnalyticsService', function ($sce,$scope,$rootScope,AnalyticsService) {

            var self = this;
            self.backgroundVideo = $scope.$resolve.backgroundVideo;
            self.categoryItems = $rootScope.categoryItems =  $scope.$resolve.categoryItems;
            self.getUrlState = getUrlState;

            self.onClick = function (id) {
                AnalyticsService.savePageEvent('category selection', id);
            };

            function getUrlState(item) {
                if((item.sub_categories)){
                    return "usxs.screen.category.subcategory({'category_id':item.category_id, 'category_name':item.category_name})";
                }else{
                    return "usxs.screen.category.subcategory.products({'category_id':item.category_id})";
                }
            }

        }]);

})();


