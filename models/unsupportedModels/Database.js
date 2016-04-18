var path            = require('path');
var redis           = require('node-orm2-redis');
var promise         = require('promise');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('database', {
        firstUpdated : { type: "boolean", defaultValue: false }, // Has the schema ever been updated
        updating     : { type: "boolean", defaultValue: true },
        name         : { type: "text" },
        title        : { type: "text" },
        type         : { type: "text" },
        subtype      : { type: "text" },
        url          : { type: "text" },
        user_id      : { type: "text" },
        credentials  : { type: "text" }
    }, {
        timestamp   : true,
        validations : {
            name : orm.enforce.required("You need to provide a name for that query")
        },
        indexes : {
            firstUpdated : redis.index.discrete
        }
    });

    global.Database = db.models.database;

    Database.databasesForUser = function(user){
        return new Promise(function(resolve, reject){
          Database.find({ user_id:user.id }, function(err, results){
            if(!err){
                resolve(objectFormatter.format(results));
            }else{
                reject(err);
            }
          });
        });
    };

    Database.countDatabasesForUser = function(user){
        var id_user;

        if(typeof(user) == "object"){ id_user = user.id; }else{ id_user = user; }

        return new Promise(function(resolve, reject){
            Database.count({ user_id: id_user }, function(err, amount){
                if(!err){ resolve(amount); }else{ reject(err); }
            });
        });
    };

    Database.databaseWithID = function(databaseId){
        return new Promise(function(resolve, reject){
            Database.one({id: databaseId}, function(err, db){
                if(err){
                    reject(err);
                }else{
                    resolve(db);
                }
            });
        });
    };

    Database.databasesForUserWithType = function(user_id, type){
        return new Promise(function(resolve, reject){
            Database.find({user_id: user_id, type: type}, function(err, results){
                if(!err){
                    resolve(objectFormatter.format(results));
                }  else {
                    reject(err);
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
