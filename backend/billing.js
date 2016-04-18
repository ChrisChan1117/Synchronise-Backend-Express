var path          = require('path');
var _             = require('underscore');
var Promise       = require('promise');
var assets        = require(path.normalize(__dirname + '/../helpers/assets'));
var Synchronise   = require("synchronise")(assets.SYNCHRONISEAPIKEY);
var userH         = require(path.normalize(__dirname + '/../helpers/user'));
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));
var stripe        = require("stripe")(assets.stripe_secret_key());

// Returns the list of credit cards owned by a user
exports.getCardsListForUser = function(request, response){
    orm.model(["User", "UserCreditCard"]).then(function(d){ // Load the models
        var user = d.User.current(request);

        d.UserCreditCard.cardsForUser(user).then(function(cards){
            // Put the default card at the beginning of the array
            var results = _.sortBy(cards, function(row){
                return row.isDefault;
            });

            // Hide sensitive data from the objects
            _.each(results, function(row, index){
                delete results[index].id_customer_stripe;
                delete results[index].id_source;
                delete results[index].token;
            });

            // Invert the array of cards
            results.reverse();
            // Send the data back to the view
            response.success(results);
        }, function(err){
            response.error(err);
        });
    });
};

// Set a card as the default card of a user
// Params
// - (string)id_card: The ID of the card to set as default
exports.setDefaultCard = function(request, response){
    orm.model(["User", "UserCreditCard"]).then(function(d){ // Load the models
        var id_card_to_set_as_default = request.params.id_card; // Id of the card to set as default
        var user = d.User.current(request);

        d.UserCreditCard.setCardAsDefault(id_card_to_set_as_default, user.id).then(function(card){
            // Update the data on stripe as well
            stripe.customers.update(card.id_customer_stripe, {
              default_source: card.id_source
            }, function(err, customer) {
                if(!err){
                    response.success(true, 200, {}, user.id);
                }else{
                    response.error(err);
                }
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Delete a card from a user account
// Params
// - (string)id_card: The ID of the card to remove
exports.deleteCard = function(request, response){
    orm.model(["User", "UserCreditCard"]).then(function(d){
        var id_card = request.params.id_card;
        var user    = d.User.current(request);

        d.UserCreditCard.deleteCard(id_card, user.id).then(function(card){
            // Delete the card from the customer's account on stripe as well
            stripe.customers.deleteCard(card.id_customer_stripe, card.id_source, function(err, confirmation) {
                if(!err){
                    response.success(true, 200, {}, user.id);
                }else{
                    response.error(err);
                }
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Save or update the info of a card
// Params
// - (string)token: The token to create a new payment source, coming from Stripe.JS
// - (string)type: The type of card (visa, mastercard, AE...)
// - (number)exp_month: The expiry month of the card
// - (number)exp_year: The expiry year of the card
// - (string)firstname: The first name of the person associated to the payment card
// - (string)surname: The surname of the person associated to the payment card
// - (string)company: The name of the company associated to the payment card
exports.saveCardInfo = function(request, response){
    var token     = request.params.token; // From Stripe
    var type      = request.params.type;
    var exp_month = request.params.exp_month;
    var exp_year  = request.params.exp_year;
    var firstname = request.params.firstname;
    var surname   = request.params.surname;
    var company   = request.params.company;
    var id_source; // To be determined later in the code below
    var last4;    // To be determined later in the code below

    var canContinue = true; // Whether or not we should proceed with the tasks

    orm.model(["UserCreditCard", "User"]).then(function(d){
        var user = d.User.current(request);

        // Collect the current cards of the user
        d.UserCreditCard.cardsForUser(user).then(function(cards){
            var id_customer_stripe = "";

            new Promise(function(resolve, reject){
                // User already has registered cards
                if(cards.length){
                    // We collect the stripe id of the user from the first card
                    id_customer_stripe = cards[0].id_customer_stripe;
                    resolve();
                }else{
                    // First time adding a card, the user has no Stripe customer account
                    // We need to create a customer on Stripe
                    stripe.customers.create({
                        description: user.id + "-" + user.name + "-" + user.email,
                        account_balance: 0,
                        email: user.email,
                        metadata: {id:user.id}
                    }, function(err, customer) {
                        if(!err){
                            id_customer_stripe = customer.id; // We now have the id of the customer on Stripe
                            resolve();
                        }else{
                            canContinue = false;
                            reject(err);
                        }
                    });
                }
            }, function(err){ // Error creating or collecting the data of the customer
                response.error(err);
            }).then(function(){
                if(canContinue){
                    return new Promise(function(resolve, reject){
                        // Store the id of the customer on Stripe onto the object of the user on Synchronise
                        d.User.updateUser({id_stripe:id_customer_stripe}, user);

                        // Create a new Credit Card object
                        stripe.customers.createSource(id_customer_stripe,{source: token}, function(err, card) {
                            if(!err){
                                // Collect if source of payment from stripe
                                id_source = card.id;
                                // and the last 4 digits for display
                                last4     = card.last4;

                                // Associate the new Credit Card object to the customer
                                stripe.customers.update(id_customer_stripe, {
                                  default_source: card.id
                                }, function(err, customer) {
                                    if(!err){
                                        resolve();
                                    }else{
                                        canContinue = false;
                                        reject(err);
                                    }
                                });
                            }else{
                                reject(err);
                            }
                        });
                    });
                }
            }, function(err){ // Error storing the card
                response.error(err);
            }).then(function(){
                if(canContinue){
                    return new Promise(function(resolve, reject){
                        // We have all the info we need so we can save the new card
                        d.UserCreditCard.registerCardForUser(token,
                                                             id_source,
                                                             last4,
                                                             exp_month,
                                                             exp_year,
                                                             type,
                                                             firstname,
                                                             surname,
                                                             company,
                                                             id_customer_stripe,
                                                             user).then(function(){
                                                                resolve();
                                                             }, function(err){
                                                                reject();
                                                             });
                    });
                }
            }, function(err){
                response.error(err);
            }).then(function(){
                if(canContinue){
                    response.success(true, 200, {}, user.id);
                }
            }, function(err){
                response.error(err);
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Subscribe a user to a plan
// Params
// - (object)plan: The plan to associate the user to example {name: "mars", type: "month"}
function subscribeToPlan(request, response){
    orm.model(["User", "UserSubscription"]).then(function(d){
        var user = d.User.current(request);
        var canContinue = true;
        var plan = "";
        var stripe_subscription_object;

        // Get a more complete object of the user, that will contain all the info about current Plan...
        d.User.userById(user.id).then(function(userObject){
            user = userObject;
            response.progress(1, "Acquired user object"); // Send a progress to the view using web sockets
        }).then(function(){
            return new Promise(function(resolve, reject) {
                // Decompose the plan to its real value on Stripe
                switch (request.params.plan.name) {
                    case "earth":
                        plan = "earth";
                        break;

                    case "mars":
                        if(request.params.plan.type == "month"){
                            plan = "mars";
                        }else{
                            plan = "marsyear";
                        }
                        break;
                }
                resolve();
                response.progress(2, "Formatted plan name"); // Send a progress to the view using web sockets
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                // Get the current subscription object for the user
                d.UserSubscription.subscriptionForUser(user).then(function(subscription){
                    var newSub = true; // By default we consider there is no objects for the subscription of the user

                    if(subscription){
                        if(subscription.id_stripe !== null && subscription.id_stripe !== ""){
                            newSub = false; // The user already has a subscription object
                        }
                    }

                    if(newSub){
                        response.progress(2.2, "Updated Stripe Subscription"); // Send a progress to the view using web sockets
                        // If there is no subscription we create one
                        if(user.id_stripe !== null){
                            stripe.customers.createSubscription(user.id_stripe, {plan: plan}, function(err, stripe_subscription){
                                if(err){
                                    response.error(err);
                                    reject(err);
                                }else{
                                    stripe_subscription_object = stripe_subscription;
                                    response.progress(3, "Created Stripe Subscription"); // Send a progress to the view using web sockets
                                    resolve();
                                }
                            });
                        }else{
                            response.error("noCard");
                        }
                    }else{
                        response.progress(2.1, "Updated Stripe Subscription"); // Send a progress to the view using web sockets
                        // If there is an existing subscription we just need to update it
                        stripe.customers.updateSubscription(user.id_stripe, subscription.id_stripe, {plan: plan}, function(err, stripe_subscription) {
                            if(err){
                                response.error(err);
                                reject(err);
                            }else{
                                stripe_subscription_object = stripe_subscription;
                                response.progress(3, "Updated Stripe Subscription"); // Send a progress to the view using web sockets
                                resolve();
                            }
                        });
                    }
                });
            });
        }).then(function(){
            d.UserSubscription.createOrActivateSubscriptionForUser(plan, user, stripe_subscription_object).then(function(){
                response.success("", 200, {}, [user]);
                response.progress(4, "Created or Updated Subscription object for User"); // Send a progress to the view using web sockets
                resolve();
            }, function(err){
                response.error(err);
                reject(err);
            });
        });
    });
}

exports.subscribeToPlan = subscribeToPlan;

// Generates a Bit.ly link to let the user invite a friend
exports.getBitLyForReferral = function(request, response){
    orm.model(["User"]).then(function(d){
        var user = d.User.current(request);
        // We use a Component from Synchronise
        // Heck, we make reusable cloud components so we might as well use them to create Synchronise
        Synchronise.Component.run("61c5092e-f1b5-404a-b09f-2aab52b19c1c", {
            url          : "https://www.synchronise.io/?referral="+user.id,
            domain       : "sncs.io",
            access_token : "da0c67e9c75f56f1947f8c5d416868471e585c7f"
        }, {
            success: function(data){
                response.success(data);
            },
            error: function(err){
                response.error(err);
            }
        });
    });
};

// Cancel the subscription of a user
exports.cancelSubscription = function(request, response){
    orm.model(["User", "UserSubscription"]).then(function(d){
        var user_id = userH.userIdWithVar(d.User.current(request));
        var user;
        var subscription;
        var id_subscription;
        var promises = [];

        // Get a more complete version of the user object
        d.User.userById(user_id).then(function(userObject){
            user = userObject;
        }).then(function(){
            return new Promise(function(resolve, reject) {
                // Get the current subscription
                d.UserSubscription.subscriptionForUser(user).then(function(subscriptionObject){
                    subscription = subscriptionObject;
                    resolve();
                }, function(err){
                    reject(err);
                });
            });
        }).then(function(){
            promises.push(new Promise(function(resolve, reject) {
                // Set the subscription has cancelled
                id_subscription = subscription.id_stripe;
                subscription.status = 0;
                subscription.id_stripe = "";
                subscription.save(function(err){
                    if(err){reject();}else{resolve();}
                });
            }));

            promises.push(new Promise(function(resolve, reject) {
                // Also cancel the subscription on Stripe
                stripe.customers.cancelSubscription(user.id_stripe, id_subscription, {at_period_end: true}, function(err, confirmation){
                    if(err){reject(err);}else{resolve();}
                });
            }));
        }).then(function(){
            Promise.all(promises).then(function(){
                response.success("", 200, {}, [user]);
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Apply a coupon code to the account of a user
// Params
// - (string)coupon: The coupon code
exports.applyCoupon = function(request, response){
    var coupon = request.params.coupon;
    orm.model(["User", "UserSubscription"]).then(function(d){
        var user, subscription;
        var id_user = userH.userIdWithVar(d.User.current(request));

        return new Promise(function(resolve, reject) {
            d.User.userById(id_user).then(function(userObject){
                user = userObject;
                resolve();
            }, function(err){
                reject(err);
                response.error(err);
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                d.UserSubscription.subscriptionForUser(user).then(function(subscriptionObject){
                    subscription = subscriptionObject;
                    resolve();
                }, function(err){
                    reject(err);
                    response.error(err);
                });
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                if(user.id_stripe === null || subscription.id_stripe === null){
                    // Artificially set the params for the function subscribeToPlan, because it reads data from the params object
                    request.params.plan = {
                        name: "earth",
                        type: "month"
                    };

                    subscribeToPlan(request, response).then(function(){
                        // Refresh user with new id_stripe
                        d.User.userById(id_user).then(function(userObject){
                            user = userObject;
                            resolve();
                        }, function(err){
                            reject(err);
                            response.error(err);
                        });
                    }, function(err){
                        reject(err);
                        response.error(err);
                    });
                }else{
                    resolve();
                }
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                d.UserSubscription.subscriptionForUser(user).then(function(subscriptionObject){
                    subscription = subscriptionObject;
                    resolve();
                }, function(err){
                    reject(err);
                    response.error(err);
                });
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                stripe.customers.updateSubscription(user.id_stripe, subscription.id_stripe,{coupon: coupon, plan:subscription.subscription}, function(err, newSubscription){
                    if(err){
                        response.error(err);
                        reject(err);
                    }else{
                        response.success();
                        resolve();
                    }
                });
            });
        });
    });
};

// List the invoices of a user
exports.listOfInvoicesForUser = function(request, response){
    orm.model(["User"]).then(function(d){
        var id_user = userH.userIdWithVar(d.User.current(request));
        var user;

        d.User.userById(id_user).then(function(user){
            if(user.id_stripe === null){
                response.success(invoices);
            }else{
                // Use a Stripe component form Synchronise to list the invoices of the user
                Synchronise.Component.run("b84bff6b-fcd4-493b-9246-d491875593b1", {customer_id: user.id_stripe, api_key: assets.stripe_secret_key()}, {
                    success: function(data){
                        response.success(data.results);
                    },
                    error: function(err){
                        response.error(err);
                    }
                });
            }
        });
    });
};
