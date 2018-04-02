(function () {
    'use strict';


    angular.module('usxsApp')
        .service('SubcategoryService', ['$http', '$q', function ($http,$q) {
            //var self = this;

            return {
                getBackground:getBackground
            };
            function getBackground() {
                //@Todo:fetch video path from table
                var media_option ='sub_category';
                var deferred = $q.defer();
                var query = "SELECT screen_media_path FROM screen_media WHERE screen_media_option = ?";
                mysql.query(query, [media_option], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

        }]);


})();