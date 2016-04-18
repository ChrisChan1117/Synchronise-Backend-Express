var redis           = require('node-orm2-redis');
var path            = require('path');
var _               = require('underscore');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('usersettings', {
        key        : { type: "text" },
        value      : { type: "text" },
        type_value : { type: "text" },
        id_user    : { type: "text" }
    }, {
        timestamp   : true,
        indexes : {
            name    : redis.index.discrete,
            key     : redis.index.discrete,
            id_user : redis.index.discrete
        }
    });

    global.UserSettings = db.models.usersettings;

    ///// METHODS /////

    // Returns a setting of a user
    // [Promise]RETURN :
    //                  - Success : If the key exists it will return it in its previous native type
    //                              If the key does not exists it will return [undefined]
    //                  - Error : Any errors that happens within the execution
    // [String]key : the key of the data to obtain
    // [String|Object] user : The user to fetch the key for. This can be either the user id or the actual user object
    function getSetting(id_user, key){
        return new Promise(function(resolve, reject){
            UserSettings.one({id_user : id_user, key : key}, function(err, record){
                if(err){ reject(err); }else{
                    if(record){
                        switch (record.type_value) {
                            case "string":
                                resolve(record.value);
                                break;

                            case "boolean":
                                var value;

                                if(record.value == "true" || record.value == "yes" || record.value == "1"){
                                    value = true;
                                }else if (record.value == "false" || record.value == "no" || record.value == "0") {
                                    value = false;
                                }else{
                                    value = Boolean(record.value);
                                }

                                resolve(value);

                                break;

                            case "number":
                                resolve(parseInt(record.value));
                                break;

                            case "object":
                                resolve(JSON.parse(record.value));
                                break;

                            default:
                                resolve(record.value);
                                break;
                        }
                    }else{
                        resolve(false);
                    }
                }
            });
        });
    }

    UserSettings.get = function(key, user){
        return new Promise(function(resolve, reject){
            var id_user;
            var canContinue = true;

            if(typeof(user) == "string"){
                id_user = user;
            }else if (typeof(user) == "object") {
                id_user = user.id;
            }else{
                canContinue = false;
                reject("The type of the user is incorrect");
            }

            if(canContinue){
                if(typeof(key) == "string"){
                    return getSetting(id_user, key).then(resolve, reject);
                }else{
                    var found = false;

                    var promise;

                    _.each(key, function(row){
                        if(typeof(promise) != "undefined"){
                            promise.then(function(modelFound){
                                if(modelFound){
                                    found = true;
                                    resolve(modelFound);
                                }

                                if(!found){
                                    return getSetting(id_user, row);
                                }
                            });
                        }else{
                            promise = getSetting(id_user, row);
                        }
                    });

                    promise.then(function(modelFound){
                        if(modelFound){
                            found = true;
                            resolve(modelFound);
                        }

                        if(!found){
                            resolve(key[key.length-1]);
                        }
                    }, reject);

                    Promise.all(promise);
                }
            }
        });
    };

    // Saves a new setting for a user
    // [Promise]RETURN :
    //                  - Success: The new setting is saved
    //                  - Error  : Any errors that happens within the execution
    // [String]key : the key of the data to save
    // [Mixed]value : The value to associate to the key
    // [String|Object] user : The user to fetch the key for. This can be either the user id or the actual user object
    UserSettings.set = function(key, value, user){
        return new Promise(function(resolve, reject){
            var id_user;
            var canContinue = true;

            if(typeof(user) == "string"){
                id_user = user;
            }else if (typeof(user) == "object") {
                id_user = user.id;
            }else{
                canContinue = false;
                reject("The type of the user is incorrect");
            }

            if(canContinue){
                var valueConverted;

                switch (typeof(value)) {
                    case "number":
                        valueConverted = value.toString();
                        break;

                    case "object":
                        valueConverted = JSON.stringify(value);
                        break;

                    default:
                        valueConverted = value;
                        break;
                }

                var setting = {
                    key        : key,
                    value      : valueConverted,
                    type_value : typeof(value),
                    id_user    : id_user
                };

                // Check if the key already exists
                UserSettings.one({id_user : id_user, key : key}, function(err, record){
                    if(record){
                        _.each(Object.keys(setting), function(item){
                            record[item] = setting[item];
                        });

                        record.save(function(err){
                            if(err){
                                reject(err);
                            }else{
                                resolve("Setting saved");
                            }
                        });
                    }else{
                        UserSettings.create(setting, function(err, keyCreated){
                            if(err){
                                reject(err);
                            }else{
                                resolve("Setting saved");
                            }
                        });
                    }
                });
            }
        });
    };

    db.sync(function(){
        cb();
    });
};
