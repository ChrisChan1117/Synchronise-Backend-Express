var path          = require('path');
var urlBodyParser = require(path.normalize(__dirname + '/../helpers/urlBodyParser'));
var objFormatter  = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));
var userH         = require(path.normalize(__dirname + '/../helpers/user'));
var assets        = require(path.normalize(__dirname + '/../helpers/assets'));
var redis         = assets.redisDataStoreCredentials;
var socketio      = require(path.normalize(__dirname + '/../routes/socket-io'));

// Removes all data from a model
// Params
// - (string)model: The name of the model to wipe
exports.wipeModel = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(request.params.model).then(function(Model){
                Model.find({}, function(err, items){
                    if(!err){
                        var promises = Array();
                        _.each(items, function(item){
                            promises.push(new Promise(function(resolve, reject){
                                item.remove(function(err){
                                    if(!err){
                                        resolve();
                                    }else{
                                        reject(err);
                                    }
                                });
                            }));
                        });

                        Promise.all(promises).then(function(){
                            response.success();
                        }, function(err){
                            response.error(err);
                        });
                    }else{
                        response.error(err);
                    }
                });
            });
        }else{
            response.error("You are not allowed to execute this function (wipeModel)");
        }
    });
};

// Wype the entire database
exports.wipeDatabase = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.database.drop(function () {
                response.success("Database dropped");
            });
        }else{
            response.error("You are not allowed to execute this function (wipeDatabase)");
        }
    });
};

// Returns the list of models
exports.modelList = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            response.success(["Cache",
                              "Component",
                              "Log",
                              "MarketPlaceCollection",
                              "Project",
                              "ProjectShared",
                              "RealtimeSubscription",
                              "Role",
                              "RoleOfUser",
                              "User",
                              "UserConnection",
                              "UserCreditCard",
                              "UserSettings",
                              "UserSubscription",
                              "UserRecoverPassword",
                              "Workflow"
                              ]);
        }else{
            response.error("You are not allowed to execute this function (modelList)");
        }
    });
};

// Count the amount of items in a specific model
// Params
// - (string)model: The name of a model
exports.modelItemsCount = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(request.params.model).then(function(Model){
                Model.count(function(err, count){
                    if(!err){
                        response.success(count);
                    }else{
                        response.error(err);
                    }
                });
            }, function(err){
                console.log(err);
            });
        }else{
            response.error("You are not allowed to execute this function (modelItemsCount)");
        }
    });
};

// Returns the content of a model
// Params
// - (string)model: The name of a model
exports.contentOfModel = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(request.params.model).then(function(Model){
                Model.find({}, function(err, records){
                    if(!err){
                        var recordsOrdered = _.each(records, function(record){
                            return new Date(record.modified_at).getTime();
                        });

                        response.success(recordsOrdered);
                    }else{
                        response.error(err);
                    }
                });
            });
        }else{
            response.error("You are not allowed to execute this function (contentOfModel)");
        }
    });
};

// Remove one item from a model
// Params
// - (string)model: The name of a model
// - (string)id: The id in database of the row to remove
exports.removeRowFromModel = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            var arrayModels = [];
            if(request.params.model != "User"){
                arrayModels = [request.params.model, "User"];
            }else{
                arrayModels = ["User"];
            }

            orm.model(arrayModels).then(function(d){
                var user = d.User.current(request);

                d[request.params.model].one({id:request.params.id}, function(err, record){
                    if(!err){
                        record.remove(function(err){
                            if(err){
                                response.error(err);
                            }else{
                                response.success("", 200, {model: request.params.model}, [user.id]);
                            }
                        });
                    }else{
                        response.error(err);
                    }
                });
            });
        }else{
            response.error("You are not allowed to execute this function (removeRowFromModel)");
        }
    });
};

// Subscribe a new function of the backend to a realtime event
// Param
// - (string)room: The room to subscribe the function to (the function triggered by the event)
// - (string)name: The name of the function (the function triggering the event)
// - (string)parameters: Stringified object of parameters to filter the event
exports.subscribeFunctionToRealTime = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["RealtimeSubscription"]).then(function(d){
                d.RealtimeSubscription.createSubscription(request.params.room).then(function(){
                    d.RealtimeSubscription.subscribeElementToRoom({
                        name       : request.params.name,
                        parameters : request.params.parameters
                    }, request.params.room).then(function(){
                        response.success();
                    },function(err){
                        response.error(err);
                    });
                }, function(err){
                    response.error(err);
                });
            }, function(err){
                response.error(err);
            });
        }else{
            response.error("You are not allowed to execute this function (subscribeFunctionToRealTime)");
        }
    });
};

// List all the realtime subscriptions
exports.listOfRealtimeSubscriptions = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["RealtimeSubscription"]).then(function(d){
                d.RealtimeSubscription.allOrdered().then(function(results){
                    response.success(results);
                }, function(err){
                    response.error(err);
                });
            }, function(err){
                response.error(err);
            });
        }else{
            response.error("You are not allowed to execute this function (listOfRealtimeSubscriptions)");
        }
    });
};

// Remove a permission from a user
// Params
// - (string)id_role: The id of the permission to remove
// - (string)id_user: The id of the user
exports.superadminRemovePermissionForUser = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["Role", "RoleOfUser"]).then(function(d){
                d.Role.rolesObjectsWithIDs(request.params.id_role).then(function(roles){
                    var role = roles[0];
                    if(role.name == "superadmin"){
                        response.error("You cannot remove the role Superadmin from a user");
                    }else{
                        RoleOfUser.removeRoleForUser(role.id, request.params.id_user).then(function(){
                            response.success();
                        }, function(err){
                            response.error(err);
                        });
                    }
                });
            });
        }else{
            response.error("You are not allowed to execute this function (superadminRemovePermissionForUser)");
        }
    });
};

// Give a permission to a user
// Params
// - (string)role_name: The name of the permission to add example: user, superadmin, marketplace...
// - (string)id_user: The id of the user
exports.superadminAddPermissionForUser = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["User"]).then(function(d){
                d.User.userById(request.params.id_user).then(function(userObject){
                    userH.createRoleIfNeededAndAssociatetoUser(userObject, [request.params.role_name]).then(function(){
                        response.success();
                    }, function(err){
                        response.error(err);
                    });
                }, function(err){
                    response.error(err);
                });
            });
        }else{
            response.error("You are not allowed to execute this function (superadminAddPermissionForUser)");
        }
    });
};

// Change the plan of a user
// Params
// - (string)email: The email of the user
// - (string)plan: The plan to give to the user
exports.superadminChangePlanForUser = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["User", "UserSubscription"]).then(function(d){
                d.User.userByEmail(request.params.email_user).then(function(userObject){
                    d.UserSubscription.createOrActivateSubscriptionForUser(request.params.plan, userObject).then(function(){
                        response.success();
                    }, function(err){
                        response.success(err);
                    });
                }, function(err){
                    response.error(err);
                });
            });
        }else{
            response.error("You are not allowed to execute this function (superadminChangePlanForUser)");
        }
    });
};

// Load the elements taht are still to be approved or rejected
exports.superadminLoadMarketplaceValidationData = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["Component", "Workflow"]).then(function(d){
                var promises = [];
                var components = [];
                var workflows = [];

                promises.push(new Promise(function(resolve, reject) {
                    d.Component.componentsWaitingForApproval().then(function(results){
                        components = results;
                        resolve();
                    });
                }));

                /*promises.push(new Promise(function(resolve, reject) {
                    d.Workflow.workflowsWaitingForApproval().then(function(results){
                        workflows = results;
                        resolve();
                    });
                }));*/

                Promise.all(promises).then(function(){
                    response.success({
                        components: components,
                        workflows: workflows
                    });
                }, function(err){
                    response.error(err);
                });
            });
        }else{
            response.error("You are not allowed to execute this function (superadminLoadMarketplaceValidationData)");
        }
    }, ["admin", "superadmin", "marketplaceValidation"]);
};

// Approve a component
// Params
// - (string)id: The id of the component to approve
exports.superadminApproveComponent = function(request, response){
    userH.isAllowedThisBackend(request, function(isAllowed){
        if(isAllowed){
            orm.model(["Component", "User", "Project"]).then(function(d){
                var user = d.User.current(request);

                d.Component.updateComponent({approved: true}, request.params.id).then(function(){
                    response.success("", 200, {}, [user.id]);
                }, function(err){
                    response.error(err);
                });

                d.Component.componentById(request.params.id).then(function(component){
                    d.Project.projectById(component.id_project).then(function(project){
                        project.published = true;
                        project.save();
                    });
                });
            });
        }else{
            response.error("You are not allowed to execute this function (superadminApproveComponent)");
        }
    }, ["admin", "superadmin", "marketplaceValidation"]);
};
