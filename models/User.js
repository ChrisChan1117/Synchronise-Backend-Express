var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var SHA256          = require("crypto-js/sha256");
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));
var assets          = require(path.normalize(__dirname + '/../helpers/assets'));


module.exports = function (db, cb) {
    db.define('user', {
        email              : { type: "text", unique: true           },
        username           : { type: "text", unique: true           },
        password           : { type: "text"                         },
        emailVerified      : { type: "boolean"                      },
        name               : { type: "text"                         },
        password_matcher   : { type: "text"                         },
        private_key        : { type: "text"                         },
        public_key         : { type: "text"                         },
        encryption_key     : { type: "text"                         },
        selected_plan_logs : { type: "text",    defaultValue: ""    },
        requests_executed  : { type: "integer", defaultValue: 0     },
        bonus_requests     : { type: "integer", defaultValue: 0     },
        avatar             : { type: "text"                         },
        id_stripe          : { type: "text"                         },
        referral           : { type: "text"                         },
        type_login         : { type: "text", defaultValue: "manual" } // manual, facebook, github, bitbucket...
    }, {
        timestamp   : true,
        validations : {
            username         : orm.enforce.required("You need to provide a username"),
            email            : orm.enforce.required("You need to provide an email address"),
            password_matcher : orm.enforce.required("Password Matcher undefined"),
            private_key      : orm.enforce.required("Private Key undefined"),
            password         : orm.enforce.ranges.length(6, undefined, "Password is too short (min 6 characters)")
        },
        indexes     : {
            email       : redis.index.discrete,
            username    : redis.index.discrete,
            name        : redis.index.discrete
        },
        autoFetch      : true,
        autoFetchLimit : 1
    });

    global.User = db.models.user;
    ///// METHODS /////
    User.logout = function(req, res){
        req.session.user = false;
        req.session.save();
        req.session.destroy(function(err) {});
    };

    User.login = function(email, password, request){
        return new Promise(function(resolve, reject){
            User.one({email:email}, function(err, user) {
                if(err){
                    reject(err);
                }else{
                    if(user         === null &&
                       typeof(user) == "undefined"){
                            reject(false);
                    }else{
                        if(SHA256(password).toString() != user.password){
                            reject(false);
                        }else{
                            User.userById(user.id).then(function(userObject){
                                request.handshake.session.user = objectFormatter.format(userObject);

                                request.handshake.session.save();
                                resolve(request.handshake.session.user);
                            }, function(err){
                                reject(err);
                            });
                        }
                    }
                }
            });
        });
    };

    User.countUsers = function(){
        return new Promise(function(resolve, reject) {
            User.count({}, function(err, amount){
                if(err){
                    reject(err);
                }else{
                    resolve(amount);
                }
            });
        });
    };

    User.emailExists = function(email){
        return new Promise(function(resolve, reject){
            User.one({email: email}, function(err, user){
                if(err){
                    reject(err);
                }else{
                    if(user === null){
                        resolve(false);
                    }else{
                        resolve(true);
                    }
                }
            });
        });
    };

    User.current = function(req){
        if(typeof(req.session) != "undefined"){
            if(typeof(req.session.user) != "undefined"){
                return req.session.user;
            }else{
                return false;
            }
        }else{
            if(typeof(req.handshake) != "undefined"){
                if(typeof(req.handshake.session.user) != "undefined"){
                    return req.handshake.session.user;
                }else{
                    return false;
                }
            }else{
                return false;
            }
        }
    };

    // Finds a user object using ID or email address
    // - (string)id: Can be either the actual ID in database or an email address
    User.userById = function(id){
        var user;

        return new Promise(function(resolve, reject){
            User.one({id: id}, function(err, u){
                if(err){ reject(err); }else{
                    user = u;
                    resolve();
                }
            });
        }).then(function(){
            if(!user){
                return new Promise(function(resolve, reject) {
                    User.one({email: id}, function(err, u){
                        if(err){ reject(err); }else{
                            user = u;
                            resolve();
                        }
                    });
                });
            }
        }).then(function(){
            return new Promise(function(resolve, reject) {
                if(!user){ reject("Undefined user"); }else{
                    var userObject = user;
                    var localPromises = Array();
                        localPromises.push(new Promise(function(resolveThis, rejectThis){
                            ormLoader.model("RoleOfUser").then(function(RoleOfUser){
                                RoleOfUser.rolesForUserId(userObject.id).then(function(roles){
                                    userObject.roles = roles;
                                    resolveThis(userObject);
                                }, rejectThis);
                            }, rejectThis);
                        }));

                        localPromises.push(new Promise(function(resolveThis, rejectThis) {
                            User.subscribtionPlan(user).then(function(subscription){
                                if(subscription){
                                    userObject.subscription       = subscription.subscription;
                                    userObject.subscriptionEnds   = subscription.ends;
                                    userObject.subscriptionActive = subscription.status;
                                    resolveThis();
                                }else{ // The user does not have a subscription, we set the default one which is earth
                                    ormLoader.model(["UserSubscription"]).then(function(d){
                                        d.UserSubscription.createOrActivateSubscriptionForUser("earth", user).then(function(subscription){
                                            userObject.subscription       = subscription.subscription;
                                            userObject.subscriptionEnds   = subscription.ends;
                                            userObject.subscriptionActive = subscription.status;
                                            resolveThis();
                                        }, rejectThis);
                                    }, rejectThis);
                                }
                            }, rejectThis);
                        }));

                        // Format public key
                        if(!userObject.public_key){
                            userObject.public_key = "";
                        }else{
                            userObject.public_key = userObject.public_key;
                        }

                        Promise.all(localPromises).then(function(){
                            resolve(userObject);
                        }, reject);
                }
            });
        });
    };

    User.userByPublicKey = function(public_key){
        var user;

        return new Promise(function(resolve, reject){
            User.one({public_key: public_key}, function(err, u){
                if(err){ reject(err); }else{
                    user = u;
                    resolve();
                }
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                if(!user){ reject("Undefined user"); }else{
                    var userObject = user;
                    var localPromises = Array();
                        localPromises.push(new Promise(function(resolveThis, rejectThis){
                            ormLoader.model("RoleOfUser").then(function(RoleOfUser){
                                RoleOfUser.rolesForUserId(userObject.id).then(function(roles){
                                    userObject.roles = roles;
                                    resolveThis(userObject);
                                }, rejectThis);
                            }, rejectThis);
                        }));

                        localPromises.push(new Promise(function(resolveThis, rejectThis) {
                            User.subscribtionPlan(user).then(function(subscription){
                                if(subscription){
                                    userObject.subscription       = subscription.subscription;
                                    userObject.subscriptionEnds   = subscription.ends;
                                    userObject.subscriptionActive = subscription.status;
                                    resolveThis();
                                }else{ // The user does not have a subscription, we set the default one which is earth
                                    ormLoader.model(["UserSubscription"]).then(function(d){
                                        d.UserSubscription.createOrActivateSubscriptionForUser("earth", user).then(function(subscription){
                                            userObject.subscription       = subscription.subscription;
                                            userObject.subscriptionEnds   = subscription.ends;
                                            userObject.subscriptionActive = subscription.status;
                                            resolveThis();
                                        }, rejectThis);
                                    }, rejectThis);
                                }
                            }, rejectThis);
                        }));

                    // Format public key
                    if(!userObject.public_key){
                        userObject.public_key = "";
                    }else{
                        try{
                            userObject.public_key = JSON.parse(userObject.public_key).javascript;
                        }catch(e){
                            userObject.public_key = userObject.public_key;
                        }
                    }

                    userObject.hasRole = function(role, needsAll){
                        if(role.indexOf("any") != -1){
                            return true;
                        }else{
                            var idsRequired = _.map(role, function(item){
                                return item.name;
                            });
                            var idsUserHas = _.map(this.roles, function(item){
                                return item.name;
                            });
                            var matching = _.intersection(idsRequired, idsUserHas);

                            if(typeof(needsAll) != "undefined"){
                                return (matching.length==idsRequired.length);
                            }else{
                                return (matching.length);
                            }
                        }
                    };

                    Promise.all(localPromises).then(function(){
                        resolve(userObject);
                    }, reject);
                }
            });
        });
    };

    User.updateUser = function(data, user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);
            User.userById(user_id).then(function(user){
                if(user){
                    _.each(Object.keys(data), function(key){
                        var dataToSave = data[key];

                        user[key] = dataToSave;
                    });

                    user.save(function(err, object){
                        if(err){ reject(err); }else{ resolve(object); }
                    });
                }else{
                    reject("Undefined component");
                }
            }, reject);
        });
    };

    User.userByEmail = function(email){
        return new Promise(function(resolve, reject){
            User.one({email: email}, function(err, user){
                if(!err){
                    if(user){
                        User.userById(user.id).then(function(userObject){
                            resolve(userObject);
                        }, function(err){
                            reject(err);
                        });
                    }else{
                        reject("No user with that email address");
                    }
                }else{
                    reject(err);
                }
            });
        });
    };

    // Return a boolean whether the user has a paymenth method setup or not
    // - (string|object)user: Accepts a user ID or a user Object
    User.hasAPaymentMethod = function(user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);
            var promises = [];
            var hasAPaymentMethod = false;

            promises.push(new Promise(function(resolve1, reject1) {
                ormLoader.model(["UserCreditCard"]).then(function(d){
                    d.UserCreditCard.cardsForUser(user).then(function(cards){
                        if(cards.length !== 0){
                            hasAPaymentMethod = true;
                        }
                        resolve1();
                    }, reject1);
                }, reject1);
            }));

            Promise.all(promises).then(function(){
                resolve(hasAPaymentMethod);
            }, reject);
        });
    };

    // Return a boolean whether the user has payed his bill this month or not
    User.hasPayedBillThisMonth = function(){

    };

    // Return the name of the subscription plan of the user
    // If no subscription returns false
    // - (string|object)user: Accepts a user ID or a user Object
    User.subscribtionPlan = function(user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);

            ormLoader.model(["UserSubscription"]).then(function(d){
                d.UserSubscription.subscriptionForUser(user).then(function(subscription){
                    if(subscription){resolve(subscription);}else{resolve(false);}
                });
            });
        });
    };

    User.countReferrals = function(user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);

            User.count({referral: user_id}, function(err, amount){
                if(err){ reject(err); }else{ resolve(amount); }
            });
        });
    };

    ///// FINAL SYNC /////
    db.sync(function(){
        cb();
    });
};
