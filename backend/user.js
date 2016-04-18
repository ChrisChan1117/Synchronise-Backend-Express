var path          = require('path');
var _             = require('underscore');
var Promise       = require('promise');
var crypto        = require('crypto');
var SHA256        = require("crypto-js/sha256");
var Mailgun       = require('mailgun-send');
var request       = require('request');
var passport      = require('passport');
var crypto        = require('crypto');
var FacebookP     = require('passport-facebook').Strategy;
var GithubP       = require('passport-github2').Strategy;
var BitbucketP    = require('jem-passport-bitbucket-oauth2').Strategy;
var GoogleP       = require('passport-google-oauth20').Strategy;

var node_cryptojs = require(path.normalize(__dirname + '/../libraries/security/cryptojs'));
var emailTemplate = require(path.normalize(__dirname + '/../models/Email'));
var CryptoJS      = node_cryptojs.CryptoJS;
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));
var assets        = require(path.normalize(__dirname + '/../helpers/assets'));
var userH         = require(path.normalize(__dirname + '/../helpers/user'));
var securityH     = require(path.normalize(__dirname + '/../helpers/security'));
var Synchronise   = require("synchronise")(assets.SYNCHRONISEAPIKEY);

Mailgun.config(assets.mailgun());

// Answers whether user should login or signup in regard to the email address provided
// Params :
// - (string)email : the email address of the user
// <<[string]success>> : "login" || "signup"
// <<[string]error>>   : "signup" || "Please provide an email address"
exports.shouldLoginOrSignup = function(request, response){
    orm.model("User").then(function(User){
        // Check an existing user based on the email address
        if(typeof(request.params.email) != 'undefined'){
            User.emailExists(request.params.email).then(function(result){
                if(result){
                    response.success('login');
                }else{
                    response.success('signup');
                }
            }, function(err){
                response.error('login');
            });
        }else{
            response.error('Please provide an email address');
        }
    });
};

// Signup a new user
// Params :
// - (string)email    : the email address of the user
// - (string)password : the password of the user (unencrypted over than SSL)
// - (string)name     : name of the user
// <<[string]success>> : "userSignedUp"
// <<[string]error>>   : "Signup is closed at the moment. Contact us at contact@synchronise.io to access the private BETA program." ||
//                       "Incorrect email : Please verify the structure of your email adress." ||
//                       "Incorrect password : Please provide as password with at least 6 characters." ||
//                       "Hmmm, I am pretty sure you have a name, you mind telling us what we should call you ?" ||
//                       "An unexpected error occured"
exports.signup = function(request, response){
    var email     = request.params.email;
    var password  = request.params.password;
    var name      = request.params.name;
    var readyToGo = true;

    orm.model(["User"]).then(function(d){
        if(!assets.validateEmail(email)){
            readyToGo = false;
            response.error('Incorrect email : Please verify the structure of your email adress.');
        }

        if(typeof(password) != "undefined"){
            if(password.length < 5){
                readyToGo = false;
                response.error('Incorrect password : Please provide as password with at least 6 characters.');
            }
        }else{
            readyToGo = false;
            response.error('Incorrect password : Please provide as password with at least 6 characters.');
        }

        if(typeof(name) != "undefined"){
            if(!name.length){
                readyToGo = false;
                response.error('Hmmm, I am pretty sure you have a name, you mind telling us what we should call you ?');
            }
        }else{
            readyToGo = false;
            response.error('Hmmm, I am pretty sure you have a name, you mind telling us what we should call you ?');
        }

        if(readyToGo){
            var password_base64            = password.toString("base64");
            var encrypted_passord_matcher  = securityH.encrypt("ok", password);

            var encrypted_password         = SHA256(password).toString();

            var public_key_rest            = assets.randomString(40); // This is the default public_key for the REST API
            var private_key                = assets.randomString(40);
            //var encryption_key             = public_key+private_key;

            var user = {
                username         : email,
                password         : encrypted_password,
                password_matcher : encrypted_passord_matcher,
                public_keys      : "", // Contains all of the PUBLIC KEYS
                private_key      : "",
                encryption_key   : "",
                email            : email,
                name             : name
            };

            // If there is a referral id
            if(request.handshake.session.referral){
                user.referral = request.handshake.session.referral;

                // Attributes the referral to the right user
                d.User.userById(request.handshake.session.referral).then(function(referrer){
                    var previousBonus = parseInt(referrer.bonus_requests)+10000;
                    d.User.updateUser({bonus_requests:previousBonus}, referrer);
                });
            }

            d.User.create(user, function(err, userCreated){
                if(err){
                    response.error(err);
                }else{
                    if(process.env.AWS){ // Only send mailgun in production mode
                        Mailgun.send({
                            recipient: email,
                            subject: emailTemplate.signup.subject,
                            body: emailTemplate.signup.body
                        });
                    }

                    userH.createRoleIfNeededAndAssociatetoUser(userCreated, ["user"]).then(function(){
                        response.success('userSignedUp');
                    });

                    d.User.countUsers().then(function(amount){
                        // This is the first user ever, we give all the admin permissions to the user
                        if(amount <= 1){
                            userH.createRoleIfNeededAndAssociatetoUser(user, ["admin", "superadmin", "docwriter", "marketplace", "marketplaceValidation"]);
                        }
                    });

                    // This executes a Clearbit function to lookup information about a user using the email address
                    Synchronise.Component.run("c340db8d-7c98-4592-a46f-e21808467844", {}, {
                        success: function(data){
                            if(data.results.person.avatar){
                                d.User.updateUser({avatar:data.results.person.avatar}, userCreated);
                            }
                        }
                    });
                }
            });
        }else{
            response.error('An unexpected error occured');
        }
    });
};

// Login a user
// Params
// - (string)email: The email of the user
// - (string)password: The password of the user
exports.login = function(request, response){
    orm.model("User").then(function(User){
        User.login(request.params.email, request.params.password, request).then(function(user){
            response.success({
                user      : user,
                user_id   : user.id,
                authToken : request.handshake.sessionID
            }, 200, {}, [user.id]);
        }, function(err){
            response.error("Username or password incorrect");
        });
    });
};

// Returns the object of a user
// - (string)user_id: The id of the user. Can be either an ID or an email
exports.userObject = function(request, response){
    orm.model("User").then(function(User){
        userH.getUserObject(request).then(function(user){
            if(typeof(user) != "undefined"){
                userH.hasRole(user, ["superadmin", "marketplaceValidation", "admin"]).then(function(hasRole){
                    if(user.id == request.params.user_id || user.email == request.params.user_id || hasRole){
                        User.userById(request.params.user_id).then(function(userObject){
                            userObject.emailVerified = undefined;
                            userObject.encryption_key = undefined;
                            userObject.password = undefined;
                            userObject.password_matcher = undefined;
                            userObject.private_key = undefined;

                            response.success(userObject);
                        }, function(error){
                            response.error(error);
                        });
                    }
                });
            }else{
                response.error("Session expired");
            }
        });
    });
};

// Get the current session of a user using the web socket data
exports.getCurrentSession = function(request, response){
    orm.model("User").then(function(User){
        if(typeof(request.handshake.session) != "undefined"){
            if(typeof(request.handshake.session.user) != "undefined"){
                User.userById(request.handshake.session.user.id).then(function(userObject){
                    response.success({
                        user    : userObject,
                        session : request.handshake.session.id
                    });
                }, function(error){
                    console.log(error);
                    response.error(error);
                });
            }else{
                response.success(false);
            }
        }else{
            response.success(false);
        }
    });
};

// Get the connections of the user, this is all the other users the current user has been in connection with (a bit like friends of the current user)
exports.getUserConnections = function(request, response){
    orm.model(["Project", "User"]).then(function(d){
        var user = d.User.current(request);

        var membersFound = Array();
        d.Project.projectsForUser(user).then(function(projects){
            var userProjects = projects;
            var connections = Array();
            _.each(userProjects, function(project){
                connections.push(new Promise(function(resolve, reject){
                    var small_connections = Array();
                    small_connections.push(new Promise(function(resolveLocal, rejectLocal){
                        d.Project.teamMembersForProject(project.id).then(function(members){
                             var members_promise = Array();
                            _.each(members, function(member){
                                members_promise.push(new Promise(function(resolveLocalMembers, rejectLocalMembers){
                                    var alreadyAdded = false;
                                    _.each(membersFound, function(mem){
                                        if(member.email == mem.email){
                                            alreadyAdded = true;
                                        }
                                    });
                                    if(!alreadyAdded){
                                        membersFound.push({
                                            "name": member.name,
                                            "email": member.email
                                          });
                                    }
                                    resolveLocalMembers();
                                }));
                            });
                            return Promise.all(members_promise).then(resolveLocal, rejectLocal);
                        });
                    }));
                    Promise.all(small_connections).then(resolve, reject);
                }));
            });
            return Promise.all(connections);
        }).then(function(){
            membersFound = _.reject(membersFound, function(member){
                return member.email == user.email;
            });
            response.success(membersFound);
        });
    });
};

// Whether or not the menu is collapsed for the current user
exports.dashboardMenuCollapsed = function(request, response){
    orm.model(["User", "UserSettings"]).then(function(d){
        var user = d.User.current(request);

        d.UserSettings.get(["dashboardMenuCollapsed", true], user).then(function(result){
            response.success(result);
        }, function(err){
            response.error(err);
        });
    });
};

// Return settings for the specific user
// Params
// - (anyTypeOfData)defaultValue: The default value of the setting if not set yet
exports.userSetting = function(request, response){
    var key = request.params.key;
    var defaultValue = request.params.defaultValue;

    var searchData;

    if(typeof(defaultValue) != "undefined"){
        searchData = [key, defaultValue];
    }else{
        searchData = key;
    }

    orm.model(["User", "UserSettings"]).then(function(d){
        var user = d.User.current(request);

        d.UserSettings.get(searchData, user).then(function(result){
            response.success(result);
        }, function(err){
            response.error(err);
        });
    });
};

// Set a setting for a user, key-value pair
// Params
// - (string)key: The key of the setting
// - (anyTypeOfData)value: The value of the setting to set
exports.userSettingSet = function(request, response){
    var key = request.params.key;
    var value = request.params.value;

    orm.model(["User", "UserSettings"]).then(function(d){
        var user = d.User.current(request);

        d.UserSettings.set(key, value, user).then(function(result){
            response.success(result, 200, {key: key}, [user.id]);
        }, function(err){
            response.error(err);
        });
    });
};

// List the unread notifications of the current user
// Example notifications :
// {
//     type     : "",
//     label    : "",
//     quantity : 1
// }
exports.unreadNotification = function(request, response){
    var unreadNotifications = [];

    orm.model(["User", "UserCreditCard"]).then(function(d){
        var user = d.User.current(request);
        var millisSinceRegister = new Date().getTime()-new Date(user.created_at).getTime();
        var millisInADay = 86400000;
        var promises = [];

        promises.push(new Promise(function(resolve, reject){
            // The user is registered for more than a day
            if((millisSinceRegister/millisInADay)>1){
                d.UserCreditCard.cardsForUser(user).then(function(cards){
                    if(!cards.length){
                        unreadNotifications.push({
                            type     : "billing",
                            label    : "noCard",
                            quantity : 1
                        });
                    }
                    resolve();
                }, reject);
            }else{
                resolve();
            }
        }));

        Promise.all(promises).then(function(){
            response.success(unreadNotifications);
        }, function(err){
            response.error(err);
        });
    });
};

// Create a new public key for the current user
exports.createPublicKey = function(request, response){
    orm.model(["User"]).then(function(d){
        // We need a proper DB object and not a cached in session
        User.userById(d.User.current(request).id).then(function(user){
            if(!user.public_key){
                var date = new Date();
                var pk = assets.randomString(10)+date.getTime();
                var public_key = pk;

                d.User.updateUser({public_key: public_key}, user.id).then(function(){
                    response.success(pk);
                }, function(err){
                    response.error(err);
                });
            }else{
                response.success(user.public_key);
            }
        });
    });
};

// Whether or not the current user has a valide payment method
exports.userHasValidPaymentMethod = function(request, response){
    orm.model(["User", "UserCreditCard"]).then(function(d){
        var user = d.User.current(request);

        d.UserCreditCard.cardsForUser(user).then(function(cards){
            response.success((cards.length>0));
        }, function(err){
            response.error(err);
        });
    });
};

// Start the recovery process of the password of a user
// Params
// - (string)email: The email of the user
exports.recoverPassword = function(request, response){
    var email = request.params.email;

    // Sends an email to the user to recover the password
    orm.model(["UserRecoverPassword", "User"]).then(function(d){
        d.User.userByEmail(email).then(function(user){
            d.UserRecoverPassword.createToken(user.id).then(function(token){
                Synchronise.Component.run("d886097f-e243-482e-8343-e3b546a14546", {
                    from    : emailTemplate.recoverPassword.from,
                    to      : email,
                    subject : emailTemplate.recoverPassword.subject,
                    html    : emailTemplate.recoverPassword.body.replace('{{TOKEN}}', token),
                    api_key : "key-78ce158d4339b8f8a14f2d730444e534",
                    domain  : "synchronise.io"
                }, {
                    success: function(data){
                        response.success();
                    },
                    error: function(err){
                        response.error(err);
                    }
                });
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Social logins
/***** PASSEPORT *****/
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    orm.model(["User"]).then(function(d){
        var err, user;
        d.userById(id).then(function(userObject){
            user = userObject;
        }, function(errObject){
            err = errObject;
        }).then(function(){
            done(err, user);
        });
    });
});

function executeStrategy(accessToken, refreshToken, profile, done){
    orm.model(["User"]).then(function(d){
        d.User.emailExists(profile.emails[0].value).then(function(exists){
            if(!exists){
                var email                      = profile.emails[0].value;
                var password_base64            = assets.randomString(10).toString("base64");
                var password                   = assets.randomString(10);
                var encrypted_passord_matcher  = securityH.encrypt("ok", password);
                var encrypted_password         = SHA256(password).toString();
                var public_key_rest            = assets.randomString(40); // This is the default public_key for the REST API
                var private_key                = assets.randomString(40);

                var user = {
                    username         : profile.emails[0].value,
                    password         : encrypted_password,
                    password_matcher : encrypted_passord_matcher,
                    public_keys      : "", // Contains all of the PUBLIC KEYS
                    private_key      : "",
                    encryption_key   : "",
                    email            : email,
                    name             : profile.displayName,
                    type_login       : profile.provider
                };

                d.User.create(user, function(err, userCreated){
                    if(err){
                        response.error(err);
                    }else{
                        if(process.env.AWS){ // Only send mailgun in production mode
                            Mailgun.send({
                                recipient: email,
                                subject: emailTemplate.signup.subject,
                                body: emailTemplate.signup.body
                            });
                        }

                        var promises = [];

                        // Gets the avatar of a user using their email address and clearbit component
                        Synchronise.Component.run("c340db8d-7c98-4592-a46f-e21808467844", {email: email, api_key: "d583d6d5c3bbaa0fe44ab27c7ddd9f5f"}, {
                            success: function(data){
                                if(data.results.person.avatar){
                                    d.User.updateUser({avatar:data.results.person.avatar}, userCreated);
                                }
                            }
                        });

                        userH.createRoleIfNeededAndAssociatetoUser(userCreated, ["user"]).then(function(){
                            done(null, userCreated);
                        });
                    }
                });
            }else{
                d.User.userByEmail(profile.emails[0].value).then(function(user){
                    if(user.type_login == profile.provider){
                        done(null, user);
                    }else{
                        done(null, false, {message:"The email address of your Synchronise account is associated to your " + user.type_login + " account."});
                    }
                });
            }
        });
    });
}

// Facebook OAuth 2.0
passport.use(new FacebookP({
    clientID: assets.facebookCredentials().app_id,
    clientSecret: assets.facebookCredentials().app_secret,
    callbackURL: assets.facebookCredentials().callbackURL,
    enableProof: true,
    profileFields: ['id', 'displayName', 'email']
}, executeStrategy));

// Github OAuth 2.0
passport.use(new GithubP({
    clientID: assets.githubCredentials().app_id,
    clientSecret: assets.githubCredentials().app_secret,
    callbackURL: assets.githubCredentials().callbackURL
}, executeStrategy));

// Bitbucket OAuth 2.0
passport.use(new BitbucketP({
    clientID: assets.bitbucketCredentials().app_id,
    clientSecret: assets.bitbucketCredentials().app_secret,
    callbackURL: assets.bitbucketCredentials().callbackURL,
    profileFields: ['id', 'displayName', 'email']
}, function(accessToken, refreshToken, profile, done){
    accessToken.provider = "bitbucket";
    executeStrategy(accessToken, refreshToken, profile, done);
}));

// Google OAuth 2.0
passport.use(new GoogleP({
    clientID: assets.googleCredentials().app_id,
    clientSecret: assets.googleCredentials().app_secret,
    callbackURL: assets.googleCredentials().callbackURL
}, executeStrategy));

exports.passport = passport;
