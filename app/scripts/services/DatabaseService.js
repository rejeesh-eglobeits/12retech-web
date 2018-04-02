(function () {
    'use strict';


    angular.module('usxsApp')

        .service('DatabaseService', ['$http', '$q', '$state','ConfigService', function ($http, $q, $state, ConfigService) {

            var configFile =  path.join(appPath, 'database-config.json');

            return {
                createConnection:createConnection,
                getCredentials: getCredentials,
                saveCredentials: saveCredentials,
                CreateDatabase:CreateDatabase
            };

            function getCredentials() {
                //@ Todo
                var deferred = $q.defer();
                if (fs.existsSync(configFile)) {
                    fs.readFile(configFile, 'utf8', function readFileCallback(err, data) {
                        if (err) {
                            deferred.reject();
                        } else {
                            var decryptedData = JSON.parse(ConfigService.decrypt(data));
                            deferred.resolve(decryptedData);
                        }
                    });
                } else {
                    deferred.reject();
                }
                return deferred.promise;
            }

            function saveCredentials(data) {
                var deferred = $q.defer();
                var encryptedData =  ConfigService.encrypt(JSON.stringify(data));
                fs.writeFile(configFile, encryptedData, 'utf8', function (err) {
                    if (err) {
                        deferred.reject(err);
                    }
                    deferred.resolve();
                });
                return deferred.promise;
            }

            function createConnection(data) {
                var deferredCnn = $q.defer();
                if(!data){
                    getCredentials().then(function (result) {
                        if (result) {
                            data = {
                                'host': '127.0.0.1',
                                'user': result.user,
                                'password': result.password,
                                'database': result.database
                            };
                            deferredCnn.resolve(data);
                        } else {
                            deferredCnn.reject("Database Credentials not found");
                        }
                    },function () {
                        deferredCnn.reject("Database Credentials not found");
                    });

                } else {
                    deferredCnn.resolve(data);
                }
                //@todo

                var deferred = $q.defer();
                deferredCnn.promise.then(function () {
                    data.host = '127.0.0.1';
                    CreateDatabase(data).then(function () {
                        mysql = mysqlClient.createConnection(data);
                        deferred.resolve(mysql);
                    }, function (err) {
                        deferred.reject(err);
                    });
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;


            }
            function CreateDatabase(data) {
                var deferred = $q.defer();
                var dbname = data.database;
                delete data.database;
                var mysql = mysqlClient.createConnection(data);
                data.database = dbname;

                mysql.connect(function (err) {
                    if (err) {
                        deferred.reject(err);
                    }
                    var query = "CREATE DATABASE IF NOT EXISTS `" + dbname + "`";
                    mysql.query(query, function (err, rows) {
                        mysql.destroy();
                        if (err) deferred.reject(err);
                        deferred.resolve(rows);
                    });
                });
                return deferred.promise;
            }
        }]);


})();