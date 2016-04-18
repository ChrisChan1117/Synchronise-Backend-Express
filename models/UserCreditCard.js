var path            = require('path');
var redis           = require('node-orm2-redis');
var Promise         = require('promise');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));

module.exports = function (db, cb) {
    db.define('usercreditcard', {
        token              : { type: "text"   },
        id_customer_stripe : { type: "text"   },
        id_source          : { type: "text"   },
        last4              : { type: "text"   },
        id_user            : { type: "text"   },
        card_type          : { type: "text"   },
        firstname          : { type: "text"   },
        surname            : { type: "text"   },
        company            : { type: "text"   },
        expiry_month       : { type: "number" },
        expiry_year        : { type: "number" },
        isDefault          : { type: "boolean", defaultValue: true }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            token        : redis.index.discrete,
            id_user      : redis.index.discrete,
            expiry_month : redis.index.discrete,
            expiry_year  : redis.index.discrete,
            card_type    : redis.index.discrete
        }
    });

    global.UserCreditCard = db.models.usercreditcard;

    // Returns a UserCreditCard object using its strip source id
    UserCreditCard.cardWithSourceId = function(id){
        return new Promise(function(resolve, reject) {
            UserCreditCard.one({id_source: id}, function(err, source){
                if(err){ reject(err); }else{ resolve(source); }
            });
        });
    };

    // Collect the list of registered tokens for cards for a user
    UserCreditCard.cardsForUser = function(user){
        return new Promise(function(resolve, reject){
            var user_id = userH.userIdWithVar(user);

            UserCreditCard.find({id_user:user_id}, function(err, cards){
                if(err){ reject(err); }else{ resolve(cards); }
            });
        });
    };

    // Set the default card of a user
    UserCreditCard.setCardAsDefault = function(id_card, user){
        return new Promise(function(resolve, reject){
            var card;

            var id_user = userH.userIdWithVar(user);

            UserCreditCard.cardsForUser(id_user).then(function(cards){
                var promises = [];

                // Set all of the existing cards as none default
                _.each(cards, function(row){
                    promises.push(new Promise(function(resolveLocal, rejectLocal){
                        if(row.id == id_card){
                            row.isDefault = true;
                            card = row;
                        }else{
                            row.isDefault = false;
                        }

                        row.save(function(err){
                            if(err){ rejectLocal(err); }else{ resolveLocal(); }
                        });
                    }));
                });

                Promise.all(promises).then(function(){
                    resolve(card);
                }, function(err){
                    reject(err);
                });
            });
        });
    };

    // Delete a card from a user account
    UserCreditCard.deleteCard = function(id_card, user){
        return new Promise(function(resolve, reject){
            var id_user = userH.userIdWithVar(user);

            UserCreditCard.cardsForUser(id_user).then(function(cards){
                if(cards.length>1){
                    var card;
                    // Find the required card
                    _.each(cards, function(row){
                        if(row.id == id_card){
                            card = row;
                        }
                    });

                    if(!card){
                        reject("We could not find this card in our system");
                    }else{
                        card.remove(function(err){
                            if(!err){ resolve(card);}else{ reject(err);}
                        });
                    }
                }else{
                    reject("You need to keep at least one card linked to your account.");
                }
            }, reject);
        });
    };

    // Register the token of a card for a user
    UserCreditCard.registerCardForUser = function(card_token, id_source, last4, expiry_month, expiry_year, card_type, firstname, surname, company, id_customer_stripe, user){
        var id_user = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject){
            // First collect all of the existing cards
            UserCreditCard.cardsForUser(user).then(function(cards){
                var promises = [];

                // Set all of the existing cards as none default
                _.each(cards, function(row){
                    promises.push(new Promise(function(resolveLocal, rejectLocal){
                        row.isDefault = false;
                        row.save(function(err){
                            if(err){ rejectLocal(err);}else{ resolveLocal(); }
                        });
                    }));
                });

                // Once all of the cards are now default
                Promise.all(promises).then(function(){
                    // Save the new card
                    // This card will be set as default automatically
                    UserCreditCard.create({
                        id_user            : id_user,
                        id_customer_stripe : id_customer_stripe,
                        id_source          : id_source,
                        last4              : last4,
                        token              : card_token,
                        expiry_month       : expiry_month,
                        expiry_year        : expiry_year,
                        card_type          : card_type,
                        firstname          : firstname,
                        surname            : surname,
                        company            : company
                    }, function(err, object){
                        if(err){ reject(err); }else{
                            // If this is the first we give 20,000 requests as a bonus
                            if(cards.length == 0){
                                ormLoader.model(["User"]).then(function(d){
                                    d.User.userById(id_user).then(function(userObject){
                                        var newBonus = parseInt(userObject.bonus_requests)+20000;
                                        d.User.updateUser({bonus_requests: newBonus}, userObject).then(function(){
                                            resolve();
                                        });
                                    });
                                });
                            }else{
                                resolve();
                            }
                        }
                    });
                }, function(err){
                    reject(err);
                });
            }, function(err){
                reject(err);
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
