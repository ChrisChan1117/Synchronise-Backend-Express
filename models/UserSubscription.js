var redis           = require('node-orm2-redis');
var path            = require('path');
var _               = require('underscore');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));

module.exports = function (db, cb) {
    db.define('usersubscription', {
        id_user      : { type: "text" },
        subscription : { type: "text" },
        id_stripe    : { type: "text" },
        ends         : { type: "date", defaultValue: new Date()},
        status       : { type: "boolean", defaultValue: 1} // 1 is active 0 is suspended
    }, {
        timestamp   : true,
        indexes : {
            id_user      : redis.index.discrete,
            subscription : redis.index.discrete,
            status       : redis.index.discrete
        }
    });

    global.UserSubscription = db.models.usersubscription;

    // Return the current subscription for a user
    // - (string|object)user: Accepts a user ID or a user Object
    UserSubscription.subscriptionForUser = function(user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);

            UserSubscription.one({id_user: user_id}, function(err, object){
                if(err){ reject(err); }else{
                    if(!object){ resolve(false); }else{ resolve(object); }
                }
            });
        });
    };

    // Creates or activate a subscription for a user
    UserSubscription.createOrActivateSubscriptionForUser = function(subrequired, user, stripe_subscription){
        var user_id = userH.userIdWithVar(user);
        var subscription;

        return new Promise(function(resolve, reject) {
            UserSubscription.subscriptionForUser(user).then(function(sub){
                if(sub){ subscription = sub; resolve(); }else{
                    var params = {id_user: user_id, subscription: subrequired};

                    UserSubscription.create(params, function(err, newSub){
                        subscription = newSub;
                        resolve();
                    });
                }
            }, reject);
        }).then(function(){
            return new Promise(function(resolve, reject) {
                // If the current subscription is not earth and the user ask for earth, the end date needs to be passed
                var dateCurrentSubscription = new Date(subscription.ends);
                var currentDate = new Date();

                if(stripe_subscription){
                    subscription.ends = new Date(stripe_subscription.current_period_end*1000);
                    subscription.id_stripe = stripe_subscription.id;
                }

                subscription.status = 1;
                subscription.subscription = subrequired;
                subscription.save(function(err, subscriptionSaved){
                    if(err){reject(err);}else{resolve(subscriptionSaved);}
                });
            });
        });;
    };

    db.sync(function(){
        cb();
    });
};
