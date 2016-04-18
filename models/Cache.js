var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('cache', {
        key       : { type: "text"    },
        category  : { type: "text"    },
        value     : { type: "text"    },
        timestamp : { type: "integer" }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            key      : redis.index.discrete,
            category : redis.index.discrete
        }
    });

    global.Cache = db.models.cache;

    // Add new key in the cache
    Cache.setCache = function(key, category, value){
        return new Promise(function(resolve, reject) {
            // Keys are unique
            Cache.removeCacheWithKey(key).then(function(){
                var val = value;
                if(typeof(val) == "object"){
                    val = JSON.stringify(val);
                }else if (typeof(val) != "string") {
                    val = val.toString();
                }

                var date = new Date();

                Cache.create({
                    timestamp: date.getTime(),
                    key: key,
                    value: val,
                    category: category
                }, function(err, cache){
                    if(err){ reject(err); }else{ resolve(cache); }
                });
            }, reject);
        });
    };


    // Remove one cache with given key
    Cache.removeCacheWithKey = function(key){
        return new Promise(function(resolve, reject) {
            Cache.one({key: key}, function(err, cache){
                if(err){ reject(err); }else {
                    if(cache){
                        cache.remove(function(err){
                            if(err){ reject(err); }else{ resolve(); }
                        });
                    }else{ resolve(); }
                }
            });
        });
    };

    // Remove all cache within a category
    Cache.removeCacheWithCategory = function(category){
        return new Promise(function(resolve, reject) {
            Cache.find({master: key}, function(err, caches){
                if(err){ reject(err); }else {
                    var promises = [];

                    _.each(caches, function(cache){
                        promises.push(new Promise(function(resolvel, rejectl) {
                            cache.remove(function(err){
                                if(err){ rejectl(err); }else{ resolvel(); }
                            });
                        }));
                    });

                    Promise.all(promises).then(resolve, reject);
                }
            });
        });
    };

    // Return one cache with a maximum age given in milliseconds
    Cache.getCacheWithKeyWithAge = function(key, age){
        return new Promise(function(resolve, reject) {
            Cache.one({key: key}, function(err, cache){
                if(err){ reject(err); }else{
                    if(cache){
                        var curDate = new Date().getTime();
                        if((curDate-cache.timestamp)<= age){
                            resolve(cache.value);
                        }else{
                            resolve(false);
                        }
                    }else{
                        resolve(false);
                    }
                }
            });
        });
    };

    // Return all of the matching key in a category with no more than a certain age
    Cache.getCacheWithCategoryWithAge = function(category, age){
        return new Promise(function(resolve, reject) {
            var results = [];

            Cache.find({category: category}, function(err, caches){
                if(err){ reject(err); }else{
                    var curDate = new Date().getTime();
                    _.each(caches, function(cur){
                        if((curDate-cur.timestamp)<= age){
                            results.push(cache.value);
                        }
                    });

                    if(results.length){
                        resolve(results);
                    }else{
                        resolve(false);
                    }
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
