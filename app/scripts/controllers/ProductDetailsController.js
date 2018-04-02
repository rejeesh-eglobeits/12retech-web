(function () {
    'use strict';
    /**
     * @ngdoc function
     * @name usxsApp.controller:ProductDetailsController
     * @description
     * # AboutCtrl
     * Controller of the usxsApp
     */
    angular.module('usxsApp')
        .controller('ProductDetailsController', ['ProductService', '$sce','$stateParams','$state','$scope','$rootScope','ConfigService', function (ProductService,$sce,$stateParams,$state,$scope,$rootScope,ConfigService) {
            var self = this;
            self.imgArray = [];
            self.QRCodeData = {
                'type': 'PRODUCT_PAGE',
                'product_id': $stateParams.product_id,
                'user_token': $rootScope.userToken,
                'device_id': localStorage.device_id,
                'device_type': localStorage.device_type
            };

            self.productItem = $scope.$resolve.proudctDetails;
            self.isQrCodeVisible = ConfigService.isVisibleQrCode();
            self.isPriceVisible = ConfigService.isVisiblePrice();
            ProductService.getBrandLogo($stateParams.product_id).then(function (res) {
             if(res.length > 0){
                 self.brandLogo =  res[0].product_media_path;
                }else{
                 self.brandLogo = "";
                }
            });

        }]);

})();