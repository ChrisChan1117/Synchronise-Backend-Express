var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));


module.exports = function (db, cb) {
    db.define('log', {
        type_object : { type: "text" }, // The type of logs (component, workflow, event...)
        id_object   : { type: "text" }, // The ID of the object in its own database
        id_user     : { type: "text" }, // The ID of the user concerned byt the log
        log         : { type: "text" }  // The actual text of the log
    }, {
        timestamp      : true,
        validations    : {},
        indexes        : {
            type_object : redis.index.discrete,
            created_at  : redis.index.discrete,
            id_object   : redis.index.discrete
        }
    });

    global.Log = db.models.log;

    // Add new log in
    // - (object)data: The attributes of the new log in a JSON representation
    Log.createLog = function(data){
        return new Promise(function(resolve, reject) {
            Log.create(data, function(err, newLog){
                if(err){ reject(err); }else{ resolve(newLog); }
            });
        });
    };

    // Return all the logs of a specific type of object for a user
    // - (string)type: The type of object to return
    // - (object|string)user : A user object or a user id
    Log.logForTypeForUser = function(type, user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Log.find({type_object: type, id_user: user_id}, function(err, results){
                if(err){ reject(err); }else{ resolve(results); }
            });
        });
    };

    // Return the logs for a specific object ID
    // - (string)type : The type of object to return
    // - (string)id   : The id of the object to return
    Log.logForTypeForObject = function(type, id){
        return new Promise(function(resolve, reject) {
            Log.find({type_object: type, id_object: id}, function(err, results){
                if(err){ reject(err); }else{ resolve(results); }
            });
        });
    };

    // Return one specific log using its ID
    // - (string)id : The ID of the log
    Log.logById = function(){
        return new Promise(function(resolve, reject) {
            Log.one({id: id}, function(err, object){
                if(err){ reject(err); }else{
                    if(object){ resolve(object)}else{ reject(undefined); }
                }
            });
        });
    };

    // Returns the last log of a user using the type of object
    // - (string)type : The type of object to return
    // - (object|string)user : A user object or a user id
    Log.lastLogForTypeForUser = function(type, user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Log.find({type_object: type, id_user: user_id}, function(err, results){
                if(err){ reject(err); }else{
                    resolve(_.sortBy(results, function(row){
                        return new Date(row.created_at).getTime();
                    }).reverse());
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
