(function () {
    'use strict';
    /**
     * @ngdoc function
     * @name usxsApp.controller:OfflineController
     * @description
     * # AboutCtrl
     * Controller of the usxsApp
     */
    angular.module('usxsApp')
        .controller('OfflineController', [ '$sce','$stateParams',function ($sce,$stateParams) {
            var self = this;
            self.connectionMsg = 'Sorry.. connection lost!!';

        }]);

})();


