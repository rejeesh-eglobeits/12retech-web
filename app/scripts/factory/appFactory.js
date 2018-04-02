'use strict';

angular.module('usxs.factory', [])

.factory('$exceptionHandler', ['$log', function($log) {
    return function myExceptionHandler(exception, cause) {
        $log.warn(exception, cause);
    };
}]);