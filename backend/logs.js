// The log backend helps displaying the logs for a user
// This backend is not finished and not functionnal at the moment
var path          = require('path');
var _             = require('underscore');
var Promise       = require('promise');
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));

exports.pickPlanForUser = function(request, response){
    orm.model(["User", "UserCreditCard"]).then(function(d){
        var user = d.User.current(request);
        var canContinue = true;

        new Promise(function(resolve, reject) {
            if (canContinue) {
                return new Promise(function(resolve, reject) {
                    if(request.params.plan == "premium"){
                        d.UserCreditCard.cardsForUser(user).then(function(cards){
                            if(!cards.length){
                                canContinue = false;
                                response.error("You need to save a payment method before proceeding with this plan.");
                                reject();
                            }else{
                                resolve();
                            }
                        }, function(err){
                            canContinue = false;
                            response.error(err);
                            reject(err);
                        });
                    }
                });
            }
        }).then(function(){
            if(canContinue){
                d.User.updateUser({
                    selected_plan_logs: request.params.plan
                }, user.id).then(function(){
                    response.success(newUser, 200, {id: user.id}, [user.id]);
                });
            }
        });
    });
};

exports.lastLogForTypeForUser = function(request, response){
    orm.model(["User", "Log"]).then(function(d){
        var user = d.User.current(request);

        d.Log.lastLogForTypeForUser(request.params.type, user).then(function(log){
            response.success(log);
        }, function(err){
            response.error(err);
        });
    });
};

// Handle expiry of the Log
function clearExpiredLog(){
    orm.model(["User", "Log"]).then(function(d){
        var date7 = new Date();
            date7.setDate(date7.getDate()-7);
            date7 = date7.getTime();

        var date365 = new Date();
            date365.setDate(date365.getDate()-365);
            date365 = date365.getTime();

        var listIDsUsers = [];

        d.Log.find({}).run(function(err, data){
            // Generate the list of unique IDs of users
            _.each(data, function(log){
                if(listIDsUsers.indexOf(log.id_user) == -1){
                    listIDsUsers.push(log.id_user);
                }
            });

            // get the subscription for each users
            var promises = [];
            var subscriptionForUser = {};
            _.each(listIDsUsers, function(id){
                promises.push(new Promise(function(resolve, reject) {
                    d.User.userById(id).then(function(user){
                        subscriptionForUser[id] = user.selected_plan_logs;
                        resolve();
                    }, function(){
                        resolve();
                    });
                }));
            });

            var toBeRemoved = [];
            Promise.all(promises).then(function(){
                // Make the list of logs that need to be removed
                _.each(data, function(log){
                    var timestampLog = new Date(log.created_at).getTime();
                    if(subscriptionForUser.hasOwnProperty(log.id_user)){
                        if(subscriptionForUser[log.id_user] == "premium"){
                            if(timestampLog<date365){
                                toBeRemoved.push(log);
                            }
                        }else{
                            if(timestampLog<date7){
                                toBeRemoved.push(log);
                            }
                        }
                    }else{
                        // User no longer exists
                        toBeRemoved.push(log);
                    }
                });

                var promisesDelete = [];
                _.each(toBeRemoved, function(log){
                    promisesDelete.push(new Promise(function(resolve, reject) {
                        log.remove(function(){
                            resolve();
                        });
                    }));
                });

                Promise.all(promisesDelete).then(function(){
                    console.log("Log cleaned");
                });
            });
        });
    });
}

setInterval(function(){
    clearExpiredLog();
}, 1000*60*60*24); // Everyday
