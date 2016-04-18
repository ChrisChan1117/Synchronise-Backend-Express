var path            = require('path');
var Promise         = require('promise');
var _               = require('underscore');
var crypto          = require('crypto');
var orm             = require(path.normalize(__dirname + '/../helpers/orm'));

// Return a user object for the current session
// Input :
//  [Object]req        : the http request that originated the page load
//  [Function]callback : the callback function to execute when done. The user object will be given has first argument of that callback
//
// Output : Promise[Object]
function getUserObject(req, callback){
    return new Promise(function(resolve, reject){
        orm.model(["User", "RoleOfUser"]).then(function(d){
            var user = d.User.current(req);

            if(user){
                d.User.userById(user.id).then(function(user){
                    var promises = [];

                    var userObject = user;
                        userObject.password_matcher   = JSON.stringify(userObject.password_matcher);
                        userObject.intercom_user_hash = crypto.createHmac('sha256', "2XI8UEPEOxTR6m9TOZv1tm-R4ejO3nZtHoYxnc0k").update(userObject.id).digest('hex');

                        userObject.getRoles = function(callback){
                            var userId = this.id;
                            d.RoleOfUser.rolesForUserId(userId).then(function(roles){
                                callback(null, roles);
                            }, function(error){
                                callback(error, null);
                            });
                        };

                        userObject.hasRole = function(role, needsAll){
                            if(role.indexOf("any") != -1){
                                return true;
                            }else{
                                var idsRequired = _.map(role, function(item){
                                    if(typeof(item) == "object"){
                                        return item.name;
                                    }else{
                                        return item;
                                    }
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

                    promises.push(new Promise(function(resolve, reject) {
                        orm.model(["Project"]).then(function(d){
                            d.Project.countProjectsForUser(userObject).then(function(amount){
                                userObject.amountOfProjects = amount;
                            }).then(function(){
                                resolve();
                            });
                        });
                    }));

                    promises.push(new Promise(function(resolve, reject) {
                        orm.model(["Component"]).then(function(d){
                            d.Component.countComponentForUser(userObject).then(function(amount){
                                userObject.amountOfComponents = amount;
                            }).then(function(){
                                resolve();
                            });
                        }, function(err){
                            console.log(err);
                        });
                    }));

                    Promise.all(promises).then(function(){
                        if(typeof(callback) != "undefined"){
                            callback(userObject);
                        }

                        resolve(userObject);
                    });
                }, function(){
                    callback(undefined);
                    resolve("User undefined");
                });
            }else{
                callback(undefined);
                resolve("User undefined");
            }
        });
    });
}

exports.getUserObject = getUserObject;

// Return the list of roles of a user
// Input :
//  [Object]user : the user object
//
// Output : [Array]
exports.rolesOfUser = rolesOfUser;
function rolesOfUser(user){
    return new Promise(function(resolve, reject){
        user.getRoles(function(err, roles){
            if(!err){
                resolve(roles);
            }else{
                reject(err);
            }
        });
    });
}

// Verify whereas a user has a one or all of the required roles given
// If you provide the role "any" the test will be skipped and always true
// Input :
//  [Object]user       : the user object
//  [Array]role        : the list of roles we want
//  [Boolean]needsAll  : whether the user needs to have all the roles given or not. default is false
//
// Output : Promise[Boolean]
function hasRole(user, role, needsAll){
    return new Promise(function(resolve, reject){
        if(role.indexOf("any") == -1){
            var needToHaveAllRoles = false;
            if(typeof(needsAll) != "undefined"){
                needToHaveAllRoles = needsAll;
            }
            rolesOfUser(user).then(function(roles){
                var hasRole = Array();

                _.each(role, function(row, i){
                    hasRole[i] = (typeof(_.find(roles, function(row2){
                        return row2.name == row;
                    })) != "undefined");
                });

                // We need to have all the items in hasRole true
                if(needToHaveAllRoles){
                    // One of the item is not true (ie the user does not have the role)
                    if(hasRole.indexOf(false) != -1){
                        resolve(false);
                    }else{ // The user has all the roles we want
                        resolve(true);
                    }
                }else{ // We need to have at least
                    // There is at least one item that is true (ie the user has at least one of the roles)
                    if(hasRole.indexOf(true) != -1){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                }
            });
        }else{
            resolve(true);
        }
    });
}

exports.hasRole = hasRole;

// Add roles to a user. If the role does not exits yet it will be created.
// Input :
//  [Object]user : the user object to work with
//  [Array]roles : the list of roles to associate to that user
//
// Output : Promise[Null]
exports.createRoleIfNeededAndAssociatetoUser = function(user, roles){
    return new Promise(function(resolve, reject){
        orm.model(["Role", "RoleOfUser"]).then(function(d){
            // Try to find the roles objects in db for their IDs
            var query = d.Role.find({name: roles}, function(err, rolesFromDB){
                var promises = Array();
                var rolesArrayFromDB = rolesFromDB;
                var nameRolesFromDB = _.map(rolesArrayFromDB, function(item){ return item.name; });
                var missingNamesOfRoles = _.filter(roles, function(item){ return (nameRolesFromDB.indexOf(item) == -1); });

                _.each(missingNamesOfRoles, function(item){
                    promises.push(new Promise(function(resolveThis, rejectThis){
                        d.Role.create({
                            name: item
                        }, function(err, role){
                            rolesArrayFromDB.push(role);
                            if(err){
                                rejectThis(err);
                            }else{
                                resolveThis();
                            }
                        });
                    }));
                });

                // Now all the roles we need exists in the database
                Promise.all(promises).then(function(resolveThis, rejectThis){
                    var promisesLocal = Array();

                    // We collect the list of Roles the user currently has
                    d.RoleOfUser.rolesForUserId(user.id).then(function(rolesOfUser){
                        var idRolesUserHas     = _.map(rolesOfUser, function(item){ return item.id_role; });
                        var idRolesWeHaveToAdd = _.map(rolesArrayFromDB, function(item){ return item.id; });
                        var missingIds         = _.difference(idRolesWeHaveToAdd, idRolesUserHas);

                        _.each(missingIds, function(item){
                            promisesLocal.push(new Promise(function(resolveThisThis, rejectThisThis){
                                d.RoleOfUser.create({
                                    id_user: user.id,
                                    id_role: item
                                }, function(){
                                    resolveThisThis();
                                });
                            }));
                        });

                        Promise.all(promisesLocal).then(function(){
                            resolve();
                            resolveThis();
                        });
                    });
                });
            });
        });
    });
};

// Return the ID of a user
// - (string|object)user: a user id OR a user object
exports.userIdWithVar = function(user){
    var user_id;
    if(typeof(user) == "string"){
        user_id = user;
    }else{
        user_id = user.id;
    }
    return user_id;
};

// Returns the list of users who are associated to a specific role
// (string|array)role : the role name of a list of roles name
exports.usersWithRole = function(role){
    return new Promise(function(resolve, reject) {
        orm.model(["User", "Role", "RoleOfUser"]).then(function(d){
            var roles = [];
            if(typeof(role) == "string"){
                roles.push(role);
            }else{
                roles = role;
            }

            var users        = [];
            var idUsersAdded = []; // Keep track of IDS to avoid duplicates
            var gPromises    = [];

            _.each(roles, function(row){
                gPromises.push(new Promise(function(resolveg, rejectg) {
                    d.Role.roleWithName(row).then(function(role){
                        d.RoleOfUser.usersIDForRole(role.id).then(function(usersId){
                            var promises = [];

                            _.each(usersId, function(id){
                                promises.push(new Promise(function(resolvel, rejectl) {
                                    d.User.userById(id).then(function(user){
                                        if(idUsersAdded.indexOf(user.id) == -1){
                                            users.push(user);
                                            idUsersAdded.push(user.id);
                                        }
                                        resolvel();
                                    }, resolvel);
                                })); // Undefined users work anyway
                            });

                            Promise.all(promises).then(function(){
                                resolveg();
                            }, rejectg);
                        }, rejectg);
                    }, rejectg);
                }));
            });

            Promise.all(gPromises).then(function(){
                resolve(users);
            }, function(err){
                console.log(err);
            });
        });
    });
};

// Check whether this user is allowed to access the following backend
// (object)request: the request coming from the client, usually this is the first parameter received by a function on the backend or the routes
// (function)callback: the callback to trigger with the answer, the first parameter of the callback is a boolean (allowed or not)
// [optional](permissions): this defines the permissions expected. You can pass an array of permissions, any of the matching permissions will return true
// if nothing is passed the default permission is 'superadmin'
exports.isAllowedThisBackend = function(request, callback, permissions){
    var perm = ["superadmin"];
    if(permissions){
        perm = permissions;
    }

    getUserObject(request, function(user){
        if(user){
            hasRole(user, perm).then(function(hasRole){
                callback(hasRole);
            });
        }else{
            callback(false);
        }
    }, function(){
        callback(false);
    });
};
