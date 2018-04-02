(function () {
    'use strict';
    angular.module('usxsApp')
        .service('CategoryService', ['$http', '$q','ScreenServices', function ($http,$q,ScreenServices) {

           var categoryItems = {}

            return {
                categoryItems:getSubCategory,
                getCategory:getProductCategory,
                getBackgroundVideo:getBackgroundVideo
            };
            function getProductCategory(data) {
                //@ Todo Apicall
                data = {}
                return $http.post(baseUrl + '/get-categories').then(function (res) {
                    categoryItems = res.data.data;
                    return res;
                });
            }
            
            function getBackgroundVideo() {
                return ScreenServices.getScreenVideo('category');
            }

            function getSubCategory(categoryid) {
                return categoryItems;
            }

        }]);


})();