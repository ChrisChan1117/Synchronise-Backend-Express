var redis           = require('node-orm2-redis');
var path            = require('path');
var _               = require('underscore');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('userregisterwhitelist', {
        email       : { type: "text" }
    }, {
        timestamp   : true,
        indexes : {
            email : redis.index.discrete
        }
    });

    global.UserRegisterWhiteList = db.models.userregisterwhitelist;

    UserRegisterWhiteList.inWhiteList = function(email){
        return new Promise(function(resolve, reject) {
            UserRegisterWhiteList.one({email: email}, function(err, user){
                if(err){
                    reject(err);
                }else{
                    if(user){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                }
            });
        });
    };

    UserRegisterWhiteList.addInWhiteList = function(email){
        return new Promise(function(resolve, reject) {
            UserRegisterWhiteList.inWhiteList(email).then(function(isInWhiteList){
                if(!isInWhiteList){
                    UserRegisterWhiteList.create({email: email}, function(err, object){
                        if(!err){
                            resolve(object);
                        }else{
                            reject(err);
                        }
                    });
                }else{
                    resolve("User already in white list");
                }
            }, reject);
        });
    };

    db.sync(function(){
        cb();
    });
};
