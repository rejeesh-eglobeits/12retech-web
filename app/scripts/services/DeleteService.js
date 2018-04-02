(function () {
    'use strict';
    angular.module('usxsApp')
        .service('DeleteService', ['$q', '$http', '$rootScope', function ($q, $http, $rootScope) {

            var self = this;


            self.deleteFile = deleteFile;
            return self;

            /**
             * Delete file
             * @param filePath
             */
            function deleteFile(filePath) {
                var deferred = $q.defer();
                if(filePath){
                    fs.unlink(filePath, function (err) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(filePath);
                        }
                    });
                } else {
                    deferred.reject('file path empty');
                }
                return deferred.promise;
            }


        }]);


})();