const file_system = require('fs');


(function () {
    'use strict';
    angular.module('usxsApp')
        .service('MigrationService', ['$rootScope', '$timeout', '$q', function ($rootScope, $timeout, $q) {

            var self = this;
            var migration_version = '1';
            var migrations_folder = __dirname + '/migrations';

            self.init = function () {
                var deferred = $q.defer();
                execute().then(function () {
                    deferred.resolve(true);
                },function (err) {
                    deferred.reject(err);
                })

                return deferred.promise;

            }

            function execute() {
                return isMigrationSchemaExists().then(function () {
                    return checkLastMigrationVersion().then(function (res) {
                        return migrate(res[0].version);
                    });
                },function (err) {
                    return createMigrationSchema().then(function () {
                       return migrate(0);
                    });
                });
            }

            function checkLastMigrationVersion() {
                var deferred = $q.defer();
                var query = "SELECT version from migration_schema order by version desc limit 1";
                mysql.query(query, function (err, rows) {
                    if (err) deferred.reject("migration_schema doesn't exist");
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function migrate(schema_version) {
                var deferred = $q.defer();
                var query = [];
                var inloop_promises = [];

                getMigrationFileList().then(function (fileList) {

                    angular.forEach(fileList, function(file_value, file_key) {

                        if(parseInt(file_value.version) > parseInt(schema_version)) {
                            var result = file_system.readFileSync(file_value.absolute_path, "utf8");
                            var migration_json = JSON.parse(result);

                            angular.forEach(migration_json, function(migration_body, migration_key) {

                                if(migration_body.hasOwnProperty("upgrade")) {
                                    
                                    var up_migration_array = migration_body["upgrade"];
                                    var up_mig_merge = query.concat(up_migration_array);
                                    query = up_mig_merge;

                                    var inloop_promise = runQuery(up_migration_array).then(function () {
                                        addNewVersion({'version':file_value.version}).then(function () {
                                            deferred.resolve(true);
                                        },function () {
                                            deferred.reject();
                                        });
                                    },function () {
                                        deferred.reject();
                                    });

                                    inloop_promises.push(inloop_promise);

                                }

                            });
                        }

                    });

                    $q.all(inloop_promises).then(function () {
                        deferred.resolve(true);
                    },function () {
                        deferred.reject();
                    });

                }, function(err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            }
            /**
             * Check if table exists
             * @return Mixed
             */
            function isMigrationSchemaExists() {
                var deferred = $q.defer();
                var query = "SELECT 1 FROM migration_schema LIMIT 1";
                mysql.query(query, function (err, rows) {
                    if (err) deferred.reject("migration_schema doesn't exist");
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }
            
            function createMigrationSchema() {
                var query= [];
                var deferred = $q.defer();
                var migration_schema = "CREATE TABLE 'migration_schema' ('version' INT PRIMARY KEY, 'date' DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE = InnoDB";
                query.push(migration_schema);
                runQuery(query).then(function () {
                    deferred.resolve(true);
                },function () {
                    deferred.reject("Could not create migration Schema");
                });
                return deferred.promise;
            }

            function addNewVersion(version_number) {
                var deferred = $q.defer();
                var query = "INSERT INTO migration_schema SET ?";
                mysql.query(query, version_number, function (err, res) {
                    if (err) deferred.reject(err);
                    if (res) deferred.resolve(res.insertId);
                });
                return deferred.promise;
            }

            function runQuery(query) {
                var promises = [];
                var deferred = $q.defer();
                for(var i =0;i<query.length;i++){
                    disableAutoCommit();
                  var promise =  mysql.query(query[i], function (err) {
                        if (err) {
                            makeManualRollback();
                            deferred.reject();
                        } else {
                            makeManualCommit();
                            deferred.resolve(true);
                        }
                    });
                    promises.push(promise);
                }
                $q.all(promises).then(function () {

                    enableAutoCommit();
                    deferred.resolve(true);
                },function () {
                    deferred.reject();
                });
                return deferred.promise;
            }

            function getMigrationFileList() {
                var deferred = $q.defer();
                var migrationFileList = [];
                file_system.readdir(migrations_folder, function (err, files) {
                    if (files) {
                        if (files.length < 1) {
                            deferred.reject('migration folder [' + migrations_folder + '] does not contains any migration');
                        } else {
                            angular.forEach(files, function(file_value, file_key) {
                                try {
                                    var result_file = parse_file(file_value, migrations_folder + '/' + file_value);
                                    migrationFileList.push(result_file);
                                } catch (e) {
                                    deferred.reject(e.message);
                                }
                            });
                            if(migrationFileList.length > 0) {
                                deferred.resolve(migrationFileList);
                            } else {
                                deferred.reject('migration folder [' + migrations_folder + '] does not contains any compatible migration');
                            }
                        }
                    } else {
                        deferred.reject(err);
                    }
                });
                return deferred.promise;
            }

            function disableAutoCommit() {
                var deferred = $q.defer();
                var target_query = "SET autocommit=0;";
                mysql.query(target_query, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function enableAutoCommit() {
                var deferred = $q.defer();
                var target_query = "SET autocommit=1;";
                mysql.query(target_query, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function makeManualCommit() {
                var deferred = $q.defer();
                var target_query = "COMMIT;";
                mysql.query(target_query, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function makeManualRollback() {
                var deferred = $q.defer();
                var target_query = "ROLLBACK;";
                mysql.query(target_query, function (err, res) {
                    if (err) deferred.reject(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function parse_file(file_name, full_path_to_file) {
                "use strict";

                var matches = /V(\d+)__([\w\_]+)\.json/g.exec(file_name);
                if (!matches || matches.index < 0) {
                    throw new Error("file ['${file_name}'] has an invalid file name template\nSee help for more information");
                }

                return {
                    version: parseInt(matches[1]),
                    name: matches[2].replace(/_/g, ' '),
                    absolute_path: full_path_to_file
                }
            }

            return self;
        }]);
})();