var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('useralpha', {
        email : { type: "text" },
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            email : redis.index.discrete
        }
    });

    global.UserAlpha = db.models.useralpha;

    // Creates one new field
    UserAlpha.register = function(email){
        return new Promise(function(resolve, reject){
            UserAlpha.one({email: email}, function(err, result){
                if(err){
                    reject(err);
                }else{
                    if(result){
                        resolve("alreadyExists");
                    }else{
                        UserAlpha.create({email: email}, function(err, result){
                            if(!err){
                                resolve();
                            }else{
                                reject(err);
                            }
                        });
                    }
                }
            });
        });
    };

    UserAlpha.amountOfUsersInList = function(){
        return new Promise(function(resolve, reject) {
            UserAlpha.count({}, function(err, amount){
                if(!err){
                    resolve(amount);
                }else{
                    reject(err);
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
