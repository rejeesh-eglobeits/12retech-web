(function () {
    'use strict';
    /**
     * @ngdoc function
     * @name usxsApp.controller:AboutCtrl
     * @description
     * # AboutCtrl
     * Controller of the usxsApp
     */
    angular.module('usxsApp')
        .controller('SubCategoryController', ['$stateParams','SubcategoryService','$rootScope','AnalyticsService', function ($stateParams,SubcategoryService,$rootScope,AnalyticsService) {
            var self = this;
            self.categoryId = $stateParams.category_id

            angular.forEach($rootScope.categoryItems, function(value, key) {
                if(value.category_id == self.categoryId){
                    self.subcategories = value.sub_categories;
                }
            });

            SubcategoryService.getBackground().then(function (res) {
                self.background =res[0].screen_media_path.replace(/\\/g,"/");
            });

            self.onClick = function (id) {
                AnalyticsService.savePageEvent('sub category selection', id);
            };

        }]);

})();