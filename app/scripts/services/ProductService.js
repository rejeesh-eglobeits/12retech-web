(function () {
    'use strict';


    angular.module('usxsApp')
        .service('ProductService', ['$http', '$q', '$sce', 'DownloadServices', '$rootScope', 'DeleteService', 'LogService', function ($http, $q, $sce, DownloadServices, $rootScope, DeleteService, LogService) {
            var tableName = 'product_media';
            $rootScope.deleteMediaFile = [];

            return {
                getProductMedia: getProductMedia,
                getProductListMediaAll: getProductListMediaAll,
                getProductById: getProductById,
                getUrl: trustedUrl,
                getProducts: getProductList,
                getProductListImageById: getProductListImageById,
                syncProductsListMedia: syncProductsListMedia,
                syncProductsMedia: syncProductsMedia,
                downloadMedia: downloadMedia,
                getProductImagesDetails: getProductImagesDetails,
                deleteProductMedia: deleteProductMedia,
                deleteProductMediaAll: deleteProductMediaAll,
                deleteProductListMediaAll: deleteProductListMediaAll,
                deleteProductMediaByProductId: deleteProductMediaByProductId,
                getProductVideo: getProductVideo,
                getBackgroundImage: getBackgroundImage,
                getBrandLogo: getBrandLogo
            };

            /**
             * Get product media by type
             * @param id
             * @param media_type
             */
            function getProductMedia(id, media_type) {
                var deferred = $q.defer();
                var query = "SELECT * FROM product_media WHERE product_id = ? AND product_media_type = ?";
                mysql.query(query, [id, media_type], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            /**
             * Get all product list media
             *
             * @returns {promise|*}*/
            function getProductListMediaAll(ids) {
                var deferred = $q.defer();

                if(ids){
                    var query = "SELECT * FROM ?? WHERE product_id IN(?) AND product_media_option in('list')";
                    mysql.query(query, [tableName,ids], function (err, rows) {
                        if (err) deferred.reject(err);
                        deferred.resolve(rows);
                    });
                }else{
                    var query = "SELECT * FROM ?? WHERE product_media_option in('list')";
                    mysql.query(query, [tableName], function (err, rows) {
                        if (err) deferred.reject(err);
                        deferred.resolve(rows);
                    });
                }
                return deferred.promise;
            }

            /**
             * Get all product media
             *
             * @param product_id
             * @returns {promise|*}
             */
            function getProductMediaAll(product_id) {
                var deferred = $q.defer();
                var query = "SELECT * FROM ?? WHERE product_id IN(?) AND product_media_option in('detail','brand_logo')";
                mysql.query(query, [tableName, product_id], function (err, rows) {
                    if (err) deferred.reject(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function syncProductsListMedia(ids) {
                var productListUrl = baseUrl + '/get-product-list';
                if (ids == null) {
                    var data = {
                        'query': {}
                    };
                } else {
                    var data = {
                        'query': {
                            'filter': {
                                'id': {
                                    'operation': "in",
                                    'value': ids
                                }
                            }
                        }
                    };
                }
                return apiRequest(productListUrl, data).then(function (listItems) {
                    var promises = [];
                    var promise;
                    var listItems = listItems.data.data;
                    if (listItems.length > 0) {
                        promise = getProductListMediaAll(ids).then(function (mediaToDel) {
                            var listPromises = [];
                            var listPromise;
                            angular.forEach(listItems, function (listItem, key) {
                                if (listItem.product_image_path || listItem.product_video_path) {
                                    var data = {
                                        'product_id': listItem.id
                                    };

                                    if (listItem.product_image_path) {
                                        var imageIndex = mediaToDel.map(function (image) {
                                            return image.product_media_url;
                                        }).indexOf(listItem.product_image_path);

                                        data.product_media_type = 'image';
                                        data.product_media_option = 'list';
                                        data.product_media_url = listItem.product_image_path;
                                        if (imageIndex > -1) {
                                            listPromise = updateProductMedia(data, mediaToDel[imageIndex].id);
                                            mediaToDel.splice(imageIndex, 1);
                                        } else {
                                            listPromise = create(data);
                                        }
                                    } else if (listItem.product_video_path) {
                                        var videoIndex = mediaToDel.map(function (video) {
                                            return video.product_media_url;
                                        }).indexOf(listItem.product_video_path);

                                        data.product_media_type = 'video';
                                        data.product_media_option = 'list';
                                        data.product_media_url = listItem.product_video_path;
                                        if (videoIndex > -1) {
                                            listPromise = updateProductMedia(data, mediaToDel[videoIndex].id);
                                            mediaToDel.splice(videoIndex, 1);
                                        } else {
                                            listPromise = create(data);
                                        }
                                    } else {
                                        listPromise = $q.resolve();
                                    }

                                    listPromises.push(listPromise);
                                }
                            });

                            var mediaIds = [];
                            var productIds = [];
                            angular.forEach(mediaToDel, function (val, key) {
                                $rootScope.deleteMediaFile.push(val.product_media_path);
                                mediaIds.push(val.id);
                                productIds.push(val.product_id);
                            });
                            deleteProductMedia(mediaIds);

                            /**
                             * delete product details
                             */
                            if(productIds.length > 0){
                                getProductMediaAll(productIds).then(function (mediaToDel) {
                                    angular.forEach(mediaToDel, function (val, key) {
                                        $rootScope.deleteMediaFile.push(val.product_media_path);
                                        mediaIds.push(val.id);
                                    });
                                    deleteProductMedia(mediaIds);
                                });
                            }

                            return $q.all(listPromises);
                        });
                        promises.push(promise);

                        angular.forEach(listItems, function (listItem, key) {
                            var productFilter = {
                                'id': listItem.id
                            }
                            promise = syncProductsMedia(productFilter);
                            promises.push(promise);
                        });
                    } else {
                        /**
                         * @todo delete saved images
                         */
                        // promise = deleteProductListMediaAll();
                        // promises.push(promise);
                    }
                    return $q.all(promises);
                });
            }

            function syncProductsMedia(filter) {
                var productDetailedUrl = baseUrl + '/get-product';
                if (filter == null) {
                    var data = {
                        'query': {}
                    };
                } else {
                    var data = filter;
                }
                return apiRequest(productDetailedUrl, data).then(function (item) {
                    item = item.data.data;
                    if (item.product_images) {
                        return getProductMediaAll(item.id).then(function (mediaToDel) {
                            var promises = [];
                            var promise;
                            angular.forEach(item.product_images, function (imageItem, key) {
                                var data = {
                                    'product_id': item.id
                                };
                                if (imageItem.product_image_path) {
                                    var imageIndex = mediaToDel.map(function (image) {
                                        return image.product_media_url;
                                    }).indexOf(imageItem.product_image_path);

                                    data.product_media_type = 'image';
                                    if (imageItem.product_image_type == "brand_logo") {
                                        data.product_media_option = 'brand_logo';
                                    } else {
                                        data.product_media_option = 'detail';
                                    }
                                    data.product_media_url = imageItem.product_image_path;
                                    if (imageIndex > -1) {
                                        promise = updateProductMedia(data, mediaToDel[imageIndex].id);
                                        mediaToDel.splice(imageIndex, 1);
                                    } else {
                                        promise = create(data);
                                    }
                                } else {
                                    promise = $q.resolve();
                                }

                                promises.push(promise);
                            });

                            var mediaIds = [];
                            angular.forEach(mediaToDel, function (val, key) {
                                $rootScope.deleteMediaFile.push(val.product_media_path);
                                mediaIds.push(val.id);
                            });
                            deleteProductMedia(mediaIds);

                            return $q.all(promises);

                        });
                    } else {
                        /**
                         * @todo delete saved images
                         */
                        //return deleteProductMediaAll();
                    }
                });
            }


            function create(data) {
                var deferred = $q.defer();
                var query = "INSERT INTO " + tableName + " SET ?";
                mysql.query(query, data, function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(data.product_id);
                });
                return deferred.promise;
            }

            function updateProductMedia(data, id) {
                var deferred = $q.defer();
                var query = "UPDATE " + tableName + " SET ? WHERE id = ?";
                mysql.query(query, [data, id], function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(data.product_id);
                });
                return deferred.promise;
            }

            function deleteProductListMediaAll() {
                var deferred = $q.defer();
                var query = "DELETE FROM " + tableName + " WHERE product_media_option = 'list'";
                mysql.query(query, [], function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function deleteProductMediaAll() {
                var deferred = $q.defer();
                var query = "DELETE FROM " + tableName + " WHERE  product_media_option = 'detail'";
                mysql.query(query, [], function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function deleteProductMedia(id) {
                var deferred = $q.defer();
                var query = "DELETE FROM " + tableName + " WHERE id IN(?)";
                mysql.query(query, [id], function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function deleteProductMediaByProductId(product_id) {
                var deferred = $q.defer();
                var query = "DELETE FROM " + tableName + " WHERE product_id IN(?)";
                getProductImagesDetails(product_id).then(function (images) {
                    if (images) {
                        angular.forEach(images, function (value, key) {
                            DeleteService.deleteFile(value.product_media_path);
                        });
                        mysql.query(query, [product_id], function (err, res) {
                            if (err) deferred.resolve(err);
                            deferred.resolve();
                        });
                    } else {
                        deferred.resolve();
                    }
                }, function () {
                    deferred.resolve();
                });
                return deferred.promise;
            }


            function update(filename, filepath, id) {
                var deferred = $q.defer();
                var query = "UPDATE " + tableName + " SET download_status = ? ,product_media_name = ?,product_media_path = ? WHERE id = ?";
                mysql.query(query, [1, filename, filepath, id], function (err, res) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(res);
                });
                return deferred.promise;
            }

            function getBrandLogo(product_id) {
                var deferred = $q.defer();
                var query = "SELECT product_media_path FROM " + tableName + " WHERE product_id = ? AND product_media_option = 'brand_logo'";
                mysql.query(query, [product_id], function (err, rows) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function apiRequest(apiUrl, data) {
                return $http.post(apiUrl, data);
            }

            function downloadMedia() {
                var deferred = $q.defer();
                getDownloadables().then(function (res) {
                    var promises = [];
                    var promise;
                    angular.forEach(res, function (value, key) {
                        promise = DownloadServices.download(value.product_media_url, value.id).then(function (res) {
                            LogService.success({'event': 'download product media', 'log': 'download completed', 'trace': 'URL: ' + res.url + ', PATH: ' + res.path});
                            if (res.insertId > 0) {
                                return update(res.filename, res.filepath, res.insertId);
                            }
                        },function (err) {
                            LogService.error({'event': 'download product media', 'log': err});
                            return $q.resolve();
                        },function (prog) {
                            LogService.success({'event': 'download product media', 'log': 'download started', 'trace': 'URL: ' + prog.url + ', PATH: ' + prog.path});
                        });
                        promises.push(promise);
                    });
                    $q.all(promises).then(function () {
                        deferred.resolve();
                    }, function (err) {
                        deferred.resolve();
                    });
                }, function () {
                    deferred.resolve();
                });
                return deferred.promise;
            }

            function getDownloadables() {
                var deferred = $q.defer();
                var query = "SELECT product_media_url,id FROM " + tableName + " WHERE download_status = 0 AND product_media_url IS NOT NULL";
                mysql.query(query, '', function (err, rows) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }


            /**
             * Get product Media by product Id
             * @param id
             */
            function getProductById(product_id) {
                var data = {'id': product_id}
                return $http.post(baseUrl + '/get-product', data).then(function (res) {
                    return getProductMedia(res.data.data.id, 'image').then(function (images) {
                        if (images.length > 0) {
                            res.data.data['product_images'] = images;
                        }
                        return res.data.data;
                    });

                });
            }

            function trustedUrl(Url) {
                return $sce.trustAsResourceUrl(Url);
            }

            function getProductList(categoryId) {
                var filter = {
                    "category_id": {
                        "operation": "=",
                        "value": categoryId
                    }
                };
                var query = {
                    "filter": filter
                };
                return $http.post(baseUrl + '/get-product-list', {'query': query}).then(function (res) {
                    var promises = [];
                    var promise;
                    angular.forEach(res.data.data, function (item, key) {
                        promise = getProductVideo(item.id).then(function (video) {

                            if (video.length > 0) {
                                return item['product_video'] = video[0].product_media_path;
                            } else {
                                return getProductListImageById(item.id).then(function (image) {
                                    if (image.length > 0) {
                                        return item['product_image'] = image[0].product_media_path;
                                    } else {
                                        return item;
                                    }

                                });
                            }

                        });

                        promises.push(promise);
                    });
                    return $q.all(promises).then(function () {
                        return $q.resolve(res);
                    }, function () {
                        return $q.resolve(res);
                    });
                });
            }


            function getProductListImageById(id) {
                var deferred = $q.defer();
                var query = "SELECT product_media_path FROM product_media WHERE product_id = ? AND product_media_option = 'list' LIMIT 1 ";
                mysql.query(query, [id], function (err, rows) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function getProductImagesDetails(product_id) {
                var deferred = $q.defer();
                var query = "SELECT product_media_path FROM product_media WHERE product_id = ?";

                mysql.query(query, [product_id], function (err, rows) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function getProductVideo(id) {
                var deferred = $q.defer();
                var query = "SELECT product_media_path,product_media_url FROM product_media WHERE product_id = ? AND product_media_type = 'video' LIMIT 1 ";
                mysql.query(query, [id], function (err, rows) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }

            function getBackgroundImage() {
                var deferred = $q.defer();
                var query = "SELECT screen_media_path FROM screen_media WHERE screen_media_option = 'product_background' LIMIT 1 ";
                mysql.query(query, function (err, rows) {
                    if (err) deferred.resolve(err);
                    deferred.resolve(rows);
                });
                return deferred.promise;
            }


        }]);


})();

