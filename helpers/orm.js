var path         = require('path');
var orm_redis    = require('node-orm2-redis');
var modts        = require('orm-timestamps');
var Promise      = require('promise');
var _            = require('underscore');
var orm          = require(path.normalize(__dirname + '/../libraries/orm'));
var assets       = require(path.normalize(__dirname + '/../helpers/assets'));
var database     = undefined;
var models       = {}; // Loads the Models in memory for faster access

orm.addAdapter('redis', orm_redis.adapter);
var opts = {
    protocol : "redis",
    host     : assets.redisDataStoreCredentials.host,
    port     : assets.redisDataStoreCredentials.port,
    password : assets.redisDataStoreCredentials.secret,
    pass     : assets.redisDataStoreCredentials.secret,
    secret   : assets.redisDataStoreCredentials.secret,
    query    : {
        pool     : true,
        debug    : false,
        strdates : false
    }
};

orm.connect(opts, function(err, db){
    if(!err){
        db.use(orm_redis.plugin);

        db.use(modts, {
            createdProperty  : 'created_at',
            modifiedProperty : 'modified_at',
            expireProperty   : false,
            dbtype           : {
                type : 'date',
                time : true
            },
            now              : function() { return new Date(); },
            expire           : function() { var d = new Date(); return d.setMinutes(d.getMinutes() + 60); },
            persist          : true
        });

        db.settings.set("properties", {
                primary_key     : "id",
                association_key : "{name}_{field}",
                required        : false
        });

        db.settings.set("instance", {
                cache           : false,
                cacheSaveCheck  : false,
                autoSave        : false,
                autoFetch       : true,
                autoFetchLimit  : 0,
                cascadeRemove   : true,
                returnAllErrors : false
        });

        db.settings.set("connection", {
                reconnect       : true,
                pool            : true,
                debug           : true
        });

        db.sync(function(err) {
            if (err) throw err;
            database = db;
        });

        db.on('error', function(err) {
            console.log(err.code); // 'ER_BAD_DB_ERROR'
        });

        var interval = setInterval(function(){
            db.ping();
        }, 55000);

        process.on('SIGINT', function() {
            clearInterval(interval);
        });
    }else{
        console.log("ORM error : " + err);
    }
});

function findModel(model){
    return new Promise(function(resolve, reject){
        if(Object.keys(models).indexOf(model) != -1){
            resolve(models[model]);
        }else{
            database.load(path.normalize(path.join('./../models/', model)), function (err) {
                if(!err){
                    models[model] = database.models[model.toLowerCase()];
                    resolve(models[model]);
                }else{
                    reject(err);
                }
            });
        }
    });
}

// Params :
// - [string|array]model : Model name to load, or array of models
// - [function]callback : a callback to call with the model, or the list of models.
//                        Each models will be a parameter, in the order they were called
exports.model = function(model, callback){
    return new Promise(function(resolve, reject){
        var canContinue = false;
        do{
            if(typeof(database) != "undefined"){
                canContinue = true;
                var tasks = Array();
                var models = [];

                if(typeof(model) == "string"){
                    tasks.push(new Promise(function(res, rej){
                        findModel(model).then(function(modelFound){
                            models = modelFound;
                            res();
                        }, rej);
                    }));
                }else{
                    _.each(model, function(row, index){
                        tasks.push(new Promise(function(res, rej){
                            findModel(row).then(function(modelFound){
                                models[row] = modelFound;
                                res();
                            }, rej);
                        }));
                    });
                }

                Promise.all(tasks).then(function(){
                    if(typeof(callback) != "undefined"){
                        if(typeof(callback) == "string"){
                            reject("Second parameter must be a function");
                            return "Second parameter must be a function";
                        }else{
                            callback.apply(null, models);
                        }
                    }

                    resolve(models);
                }, reject);
            }
        }while(!canContinue);
    });
};

exports.database = function(){
    return database;
};
