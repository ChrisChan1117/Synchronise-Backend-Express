var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var assets          = require(path.normalize(__dirname + '/../helpers/assets'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('userrecoverpassword', {
        id_user : { type: "text" },
        token   : { type: "text" },
        expires : { type: "number" }
    }, {
        timestamp   : true,
        indexes : {
            id_user : redis.index.discrete,
            token   : redis.index.discrete,
            expires : redis.index.discrete
        }
    });

    global.UserRecoverPassword = db.models.userrecoverpassword;

    ///// METHODS /////
    UserRecoverPassword.createToken = function(id_user){
        return new Promise(function(resolve, reject) {
            UserRecoverPassword.removeAllTokensForUserId(id_user).then(function(){
                var date = new Date();
                var datePlusOne = new Date();
                    datePlusOne = datePlusOne.setDate(datePlusOne.getDate()+1);

                var token = assets.randomString(10)+id_user+date.getTime();
                UserRecoverPassword.create({
                    id_user: id_user,
                    token: token,
                    expires: datePlusOne
                }, function(err, object){
                    if(err){
                        reject(err);
                    }else{
                        resolve(token);
                    }
                });
            });
        });
    };

    UserRecoverPassword.removeAllTokensForUserId = function(user_id){
        return new Promise(function(resolve, reject) {
            UserRecoverPassword.find({id_user: user_id}, function(err, objects){
                if(err){
                    reject(err);
                }else{
                    var promises = [];
                    for (var i = 0; i < objects.length; i++) {
                        var row = objects[i];
                        promises.push(new Promise(function(resolve2, reject2) {
                            row.remove(function(){
                                resolve2();
                            });
                        }));
                    }
                    Promise.all(promises).then(function(){
                        resolve();
                    }, function(error){
                        reject(error);
                    });
                }
            });
        });
    };

    // Token is valid if it is not expired
    UserRecoverPassword.isTokenValid = function(token){
        return new Promise(function(resolve, reject) {
            // Find the token
            UserRecoverPassword.one({token: token}, function(err, object){
                if(err){
                    reject(err);
                }else{
                    var date = new Date();
                    resolve(date.getTime() <= object.expires);
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
