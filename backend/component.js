var path        = require('path');
var _           = require('underscore');
var Promise     = require('promise');
var check       = require('syntax-error');
var cp          = require('child_process');
var orm         = require(path.normalize(__dirname + '/../helpers/orm'));
var assets      = require(path.normalize(__dirname + '/../helpers/assets'));
var userH       = require(path.normalize(__dirname + '/../helpers/user'))
var LIMIT_REQUESTS_FREE_PLAN = assets.LIMIT_REQUESTS_FREE_PLAN; // Get the defaut limit of requests a user can execute on the free plan
var TIMEOUT_COMPONENT = 20000; // The default timeout for a component before it gets killed, 20 seconds

// Params :
// - id_component: The id of the component we are working with
exports.executeComponent = function(request, response, type_request){
    var startTimestamp = new Date().getTime();
    var endTimestamp   = new Date().getTime();
    var id             = request.params.id_component;
    var public_key     = request.public_key; // Set by default by the Synchronise.Js library

    var canContinue = true;
    new Promise(function(resolve, reject) {
        if(!id){
            reject();
            response.error({err: "Component id not provided", code: 103}, 103);
            canContinue = false;
        }else{
            resolve();
        }
    }).then(function(){
        if(canContinue){
            orm.model(["User", "Component", "Log"]).then(function(d){
                var logObject = {
                    type_object: "component",
                    id_object: id,
                    log: ""
                };

                // Get the component object
                d.Component.componentById(id).then(function(component){
                    if(!component){
                        logObject.log += "Undefined component\n";
                        response.error("Undefined component", 104);
                    }else{
                        // Get the user object with its Public key
                        d.User.userByPublicKey(public_key).then(function(user){
                            if(parseInt(user.requests_executed) >= (LIMIT_REQUESTS_FREE_PLAN+parseInt(user.bonus_requests) )
                                && user.subscription != "mars"
                                && user.subscription != "marsyear"
                                && user.subscription != "superjedi"
                                && LIMIT_REQUESTS_FREE_PLAN != -1){

                                response.error({err: "You have reached the limit of your FREE plan. Add a payment method to continue executing Components.", code: 108}, 108);

                            }else{
                                logObject.id_user = user.id;

                                var key_found = false;
                                if(component.user_id == user.id || user.hasRole(["superadmin", "admin", "marketplaceValidation"])){
                                    key_found = true;
                                }

                                if(!key_found){
                                    logObject.log += "User with public key " + public_key + " is not allowed to execute the component\n";

                                    var helpToResolve = "";
                                    switch(type_request){
                                        case "REST":
                                            helpToResolve = "You need to provide your PUBLIC KEY in the header of your request (x-synchronise-public-key)";
                                            break;

                                        default:
                                            helpToResolve = "Perhaps you forgot to initialise the library? Synchronise.init('YOUR_PUBLIC_KEY')";
                                            break;
                                    }

                                    response.error({err: "You are not allowed to execute this component. " + helpToResolve, code: 105}, 105);
                                }else{
                                    var succeeded, failed;
                                    // Whether or not we bypass putting the component in a VM
                                    // Components that have been approved are considered safe, therefore we bypass the VM in order to make them execute faster
                                    var bypassVM = false;

                                    if(component.approved || component.is_forked){
                                        bypassVM = true;
                                    }

                                    var worker = cp.fork(path.normalize(__dirname + '/../bin/execute_component'),
                                                        [component.code.toString(),
                                                         JSON.stringify(request.params),
                                                         JSON.stringify(component.inputs),
                                                         user.subscription,
                                                         JSON.stringify(logObject),
                                                         JSON.stringify(component.outputs),
                                                         bypassVM]);

                                        // Listen for events from the worker
                                        worker.on('message', function(object) {
                                            switch (object.type) {
                                                case "success":
                                                    succeeded = true;
                                                    response.success(object.data);
                                                    break;

                                                case "error":
                                                    failed = true;
                                                    response.error(object.err, object.code);
                                                    break;

                                                case "progress":
                                                    response.progress(object.progress, object.message);
                                                    break;

                                                case "log":
                                                    response.log(object.message);
                                                    break;

                                                case "incrementUsageUser":
                                                    d.User.updateUser({requests_executed: parseInt(user.requests_executed)+1}, user);
                                                    break;

                                                case "logObject":
                                                    logObject = object;
                                                    break;
                                            }
                                        });

                                        // Worked failed/crashed
                                        worker.on('exit', function (code, signal) {
                                            endTimestamp = new Date().getTime();
                                            logObject.log += "Execution time: " + (endTimestamp-startTimestamp) + " milliseconds\n";

                                            if(!(succeeded || failed)){
                                                logObject.log += "The execution has timed out (execution was more than 20 seconds). You need to call either success() or error() in order to avoid a timeout.\n";
                                                d.Log.createLog(logObject);
                                            }

                                            d.Log.createLog(logObject);
                                        });

                                        worker.on('error', function (err) {
                                            console.log("error");
                                            response.log(err);
                                        });

                                        setTimeout(function killOnTimeOut() {
                                            if(!(succeeded || failed)){
                                                console.log("timeout");
                                                worker.kill();
                                            }
                                        }, TIMEOUT_COMPONENT);
                                }
                            }
                        });
                    }
                }, function(error){
                    logObject.log += "Undefined component\n";
                    response.error("Undefined component", 104);
                });
            });
        }
    });
};

// Creates a new Component
// Params :
// - (string)code : The code string of the component
// - (string)name : Name of the component
// - (string)id_project: The ID of the project to associate the component to
exports.createComponent = function(request, response){
    var canContinue   = true;
    var code          = request.params.code;
    var name          = request.params.name;
    var id_project    = request.params.id_project;

    new Promise(function(resolve, reject) {
        // Code not provided
        if(!code.length){
            canContinue = false;
            response.error({err_type: "code", err: "Code for the component not provided"});
        }else{ resolve(); }
    }).then(function(){
        if(canContinue){
            // Syntax error in the code
            var err = check(code);
            if(err){
                canContinue = false;
                response.error({err_type: "syntaxError", err: err});
            }
        }
    }).then(function(){
        if(canContinue){
            // Name not provided
            if(!name.length){
                canContinue = false;
                response.error({err_type: "name", err: "Name for the component not provided"});
            }
        }
    }).then(function(){
        if(canContinue){
            orm.model(["Component", "User", "Project"]).then(function(d){
                var user = d.User.current(request);
                d.Project.teamMembersForProject(id_project).then(function(members){
                    d.Component.createComponent(name, code, user, id_project).then(function(component){
                        response.success(component, 200, {}, _.map(members, function(row){
                            return row.id;
                        }));
                    }, function(err){
                        response.error({err_type: "componentCreate", err: err});
                    });
                });
            });
        }
    });
};

// Updater the dtaa of a component
// Params :
// - (object)data : A key value object of all the properties to update on the object
// - (string)id   : The ID of the component to update
exports.updateComponent = function(request, response){
    var canContinue = true;
    var data        = request.params.data;
    var id          = request.params.id;

    new Promise(function(resolve, reject) {
        if(!data){
            canContinue = false;
            response.error("You have not provided any propertes to update");
            reject();
        }else{
            // Update of the code
            if(typeof(data.code) != "undefined"){
                var err = check(data.code);

                if(err){
                    canContinue = false;
                    response.error({err_type: "syntaxError", err: err});
                    reject();
                }else{
                    resolve();
                }
            }else{
                resolve();
            }
        }
    }).then(function(){
        if(canContinue){
            if(!id){
                canContinue = false;
                response.error("You have not provided an ID of component");
            }
        }
    }).then(function(){
        if(canContinue){
            orm.model(["User", "Component"]).then(function(d){
                d.Component.componentById(id).then(function(component){
                    var user = d.User.current(request);
                    if(user.id == component.user_id){
                        d.Component.updateComponent(data, id).then(function(updatedObject){
                            response.success(updatedObject, 200, {id: updatedObject.id}, updatedObject.user_id);
                        });
                    }
                });
            });
        }
    });
};

// Returns the list of component for a user
// Params
// - (boolean|undefined)code: Whether or not to return the code of the component, help securing and reducing the bandwidth footprint
exports.listOfComponents = function(request, response){
    orm.model(["User", "Component", "Project"]).then(function(d){
        var user = d.User.current(request);

        // Returns the list of components for a user
        d.Component.componentsForUser(user).then(function(components){
            if(typeof(request.params.code) != "undefined"){
                if(!request.params.code){
                    _.each(components, function(row){
                        row.code = undefined;
                    });
                }
            }

            // Some of the projects to which a Component belong might have been removed
            // In that case we need to remove the Component
            var promises = [];
            var componentsOk = [];
            var projects = {}; // cache for project list

            _.each(components, function(component){
                promises.push(new Promise(function(resolve, reject) {
                    if(projects.hasOwnProperty(component.id_project)){
                        componentsOk.push(component);
                        resolve();
                    }else{
                        d.Project.projectById(component.id_project).then(function(project){
                            if(project){
                                componentsOk.push(component);
                                projects[component.id_project] = project;
                            }else{
                                component.remove();
                            }
                            resolve();
                        });
                    }
                }));
            });

            Promise.all(promises).then(function(){
                response.success(componentsOk);
            });
        }, response.error);
    });
};

// Returns the list of components for a specific project
// Params
// - (string)id: The id of the project
exports.getComponentsForProject = function(request, response){
    orm.model(["User", "Component"]).then(function(d){
        var user = d.User.current(request);

        d.Component.componentsForProject(request.params.id).then(function(components){
            response.success(components);
        }, response.error);
    });
};

// Get the components for a Project in the context of a Workflow
// Params
// - (string)id: The id of the project
exports.getComponentsForProjectForWorkflow = function(request, response){
    orm.model(["User", "Component"]).then(function(d){
        var user = d.User.current(request);

        d.Component.componentsForProjectForWorkflow(request.params.id, user).then(function(components){
            response.success(components);
        }, response.error);
    });
};

// Return a component object using its ID
// Params
// - (string)id: The id of the component
// - (boolean|undefined)code: Whether or not to return the code of the component, help securing and reducing the bandwidth footprint
// - (boolean|undefined)style: Whether or not to return the style of the project (background color, textcolor...), help securing and reducing the bandwidth footprint
exports.loadComponent = function(request, response){
    var canContinue = true;
    var id = request.params.id;
    var style;
    var component;

    orm.model(["User", "Component", "Project"]).then(function(d){
        var user;
        new Promise(function(resolve, reject) {
            userH.getUserObject(request).then(function(userObject){
                resolve();
                user = userObject;
            }).then(function(){
                reject();
            });
        }).then(function(){
            return new Promise(function(resolve, reject) {
                if(!id){
                    reject();
                    response.error("Id of the component not provided");
                    canContinue = false;
                }else{ resolve(); }
            });
        }).then(function(){
            if(canContinue){
                return new Promise(function(resolve, reject) {
                    d.Component.componentById(id).then(function(comp){
                        if(comp){
                            component = comp;
                            if(request.params.hasOwnProperty("code")){
                                if(request.params.code === false){
                                    component.code = undefined;
                                }
                            }

                            if(component.is_forked
                            && !user.hasRole(["admin", "superadmin", "marketplaceValidation"])){
                                component.code = undefined;
                            }
                        }

                        resolve();
                    }, reject);
                });
            }
        }).then(function(){
            if(component){
                if(canContinue && request.params.style && component.id_project){
                    return new Promise(function(resolve, reject) {
                        d.Project.projectById(component.id_project).then(function(project){
                            if(project){
                                style = {
                                    bg_color  : project.bg_color,
                                    txt_color : project.txt_color,
                                    icon_flts : project.icon_flts,
                                    icon      : project.icon
                                };
                            }else{
                                component = false;
                            }
                            resolve();
                        }, reject);
                    });
                }else if(canContinue && request.params.style) {
                    style = {
                        bg_color  : "white",
                        txt_color : "black",
                        icon_flts : "",
                        icon      : "https://images.synchronise.io/defaultProjectIcon.png"
                    };
                }
            }
        }).then(function(){
            if(canContinue){
                response.success({
                    component : component,
                    style     : style
                });
            }
        });
    });
};

// Count the amount of components owned by a user
exports.countComponent = function(request, response){
    orm.model(["User", "Component"]).then(function(d){
        var user = d.User.current(request);

        d.Component.countComponentForUser(user).then(function(amount){
            response.success({count: amount});
        }, response.error);
    });
};

// Remove a component
// Params
// - (string)id: The id of the component
exports.removeComponent = function(request, response){
    orm.model(["User", "Component"]).then(function(d){
        var user = d.User.current(request);
        var id   = request.params.id;

        d.Component.componentById(id).then(function(comp){
            if(comp.user_id != user.id){
                response.error("You do not have the right to remove this component");
            }else{
                comp.remove(function(err){
                    if(err){ response.error(err); }else{ response.success("success", 200, {id:id}, [user.id]); }
                });
            }
        });
    });
};

// Clone a component, typically from the marketplace
// Params
// - (string)id: The ID of the component to clone
exports.cloneComponent = function(request, response){
    orm.model(["Component", "User"]).then(function(d){
        var user = d.User.current(request);

        d.Component.componentById(request.params.id).then(function(component){
            if(component){
                if(user.id != component.user_id){ // User is not the owner of the component
                    d.Component.clone(component.id, user).then(function(forked){ // Fork the component. If the user already has forked the component it returns the same one not a new one
                        response.success({id: forked.id});
                    });
                }else if(user.id == component.user_id){ // User is the owner of the component
                    response.success({id: request.params.id});
                }else{
                    response.error("Session expired. Please refresh the page and loggin again");
                }
            }else{
                response.error("Session expired. Please refresh the page and loggin again");
            }
        });
    });
};

// Returns the list of the last components the user has worked on. This is displayed on the dashboard
exports.lastComponentsForUser = function(request, response){
    orm.model(["Component", "User"]).then(function(d){
        var user = d.User.current(request);

        d.Component.lastComponentsForUser(user).then(function(comps){
            var components = [];
            // Remove useless elements for that answer
            for (var i = 0; i < comps.length; i++) {
                var compCopy = comps[i];
                    compCopy.code = undefined;
                components.push(compCopy);
            }

            response.success(components);
        }, function(err){
            response.error(err);
        });
    });
}
