var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));
var assets          = require(path.normalize(__dirname + '/../helpers/assets'));

module.exports = function (db, cb) {
    db.define('component', {
        name             : { type: "text"   },
        description      : { type: "text"   },
        user_id          : { type: "text"   },
        code             : { type: "text"   },
        identifier       : { type: "text"   },
        inputs           : { type: "text"   }, // Formats in JSON
        outputs          : { type: "text"   }, // Formats in JSON
        profile          : { type: "text"   }, // Formats in JSON, avoid having to repeat some inputs all the time  
        settings         : { type: "text"   },
        tags             : { type: "text"   }, // Formats in JSON
        id_project       : { type: "text"   },
        published        : { type: "boolean", defaultValue: false}, // Whether of not the owner decides to publish the component
        approved         : { type: "boolean", defaultValue: false}, // Whether or not an admin from Synchronise has approved the publication of the component
        rejected         : { type: "boolean", defaultValue: false}, // Whether or not the component has been rejected
        amount_execution : { type: "number" , defaultValue: 0    }, // The amount of time the component has been executed
        is_forked        : { type: "boolean", defaultValue: false}, // Whether or not the component is a forked version of another one
        parent_fork      : { type: "text" } // The id of the Component parent of the following one (which is forked)
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            name        : redis.index.discrete,
            user_id     : redis.index.discrete,
            id_project  : redis.index.discrete,
            published   : redis.index.discrete,
            approved    : redis.index.discrete,
            rejected    : redis.index.discrete,
            is_forked   : redis.index.discrete,
            parent_fork : redis.index.discrete
        }
    });

    global.Component = db.models.component;

    // Create a new component
    // Params :
    // - (string)name          : The name to give to the component
    // - (string)code          : The version of the code provided by the user
    // - (string|object) user  : A user id or a user object
    // [return]Promise :
    //  - (object)success : The created object
    //  - (mixed)error    : Any error that has occured
    Component.createComponent = function(name, code, user, id_project){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Component.create({
                name          : name,
                code          : code,
                user_id       : user_id,
                id_project    : id_project
            }, function(err, object){
                if(err){ reject(err); }else{ resolve(object); }
            });
        });
    };

    // Returns the list of all the components owned by a user or shared with him/her
    // Params :
    // - (string|object) user : A user id or a user object
    // [return]Promise :
    //  - (Array)success : The list of component that the user owns
    //  - (mixed)error   : Any error that has occured
    Component.componentsForUser = function(user){
        var user_id = userH.userIdWithVar(user);
        var promises = [];
        var components = [];
        var idCompsAlreadyIn = [];

        // Find projects owned by the user
        promises.push(new Promise(function(resolve, reject) {
            Component.find({user_id: user_id}, function(err, comps){
                if(err){ reject(err); }else{
                    for (var i = 0; i < comps.length; i++) {
                        var comp = comps[i];
                        if(idCompsAlreadyIn.indexOf(comp.id) == -1){
                            idCompsAlreadyIn.push(comp.id);
                            components.push(comp);
                        }
                    }
                    resolve();
                }
            });
        }));

        // Find components of projects shared with the user
        // But first find all the projects the user is member of
        promises.push(new Promise(function(resolve, reject) {
            ormLoader.model(["ProjectShared"]).then(function(d){
                d.ProjectShared.projectsSharedWithUser(user_id).then(function(projects){
                    var promisesLocal = [];
                    // Now lets find all components (that are not forked and not already owned by the user) for those projects
                    for (var i = 0; i < projects.length; i++) {
                        var project = projects[i];
                        promisesLocal.push(new Promise(function(resolve2, reject2) {
                            Component.componentsForProject(project.id_project, undefined, true).then(function(comps){
                                for (var i = 0; i < comps.length; i++) {
                                    var comp = comps[i];
                                    if(idCompsAlreadyIn.indexOf(comp.id) == -1){
                                        idCompsAlreadyIn.push(comp.id);
                                        components.push(comp);
                                    }
                                }
                                resolve2();
                            }, function(err){
                                reject2(err);
                            });
                        }));
                    }

                    Promise.all(promisesLocal).then(function(){
                        resolve();
                    }, function(err){
                        reject(err);
                    });
                }, function(err){
                    reject(err);
                });
            });
        }));

        return new Promise(function(resolve, reject) {
            Promise.all(promises).then(function(){
                resolve(components);
            }, function(err){
                reject(err);
            });
        });
    };

    // Returns the list of the last components updated by the user
    // Params :
    // - (string|object) user : A user id or a user object
    // [return]Promise :
    //  - (Array)success : The list of component that the user owns
    //  - (mixed)error   : Any error that has occured
    Component.lastComponentsForUser = function(user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Component.find({user_id: user_id, is_forked: false}, 10, ['modified_at', 'Z'], function(err, comps){
                if(err){ reject(err); }else{ resolve(comps); }
            });
        });
    };

    // Return one component object using its ID
    // Params :
    // - (string)comp_id : Id of the component to return
    // [return]Promise :
    //  - (object|boolean)success : Return the component object if found, return false if not found
    //  - (mixed)error            : Any error that has occured
    Component.componentById = function(comp_id){
        return new Promise(function(resolve, reject) {
            Component.one({id: comp_id}, function(err, comp){
                if(err){ reject(err); }else{
                    if(comp){
                        if(comp.inputs){
                            if(!assets.isJson(comp.inputs)){
                                comp.inputs = [];
                            }else{
                                comp.inputs = JSON.parse(comp.inputs).data;
                            }
                        }else{
                            comp.inputs = [];
                        }

                        if(comp.outputs){
                            if(!assets.isJson(comp.outputs)){
                                comp.outputs = [];
                            }else{
                                comp.outputs = JSON.parse(comp.outputs).data;
                            }
                        }else{
                            comp.outputs = [];
                        }

                        if(comp.tags){
                            if(!assets.isJson(comp.tags)){
                                comp.tags = [];
                            }else{
                                comp.tags = JSON.parse(comp.tags).data;
                            }
                        }else{
                            comp.tags = [];
                        }

                        resolve(comp);
                    }else{ resolve(false); }
                }
            });
        });
    };

    // Return the list of components for a specific project
    // Params :
    // - (string)id_project : The id of the project
    // [return]Promise :
    //  - (array)success : Returns the list of components
    //  - (mixed)error    : Any error that has occured
    Component.componentsForProject = function(id_project, mustBePublished, mustNotBeForked){
        return new Promise(function(resolve, reject) {
            var params = {id_project: id_project};
            if(typeof(mustBePublished) != "undefined"){
                params.published = mustBePublished;
            }
            if(typeof(mustNotBeForked) != "undefined"){
                params.is_forked = !mustNotBeForked;
            }

            Component.find(params, function(err, results){
                _.each(results, function(row){
                    if(row.tags){
                        if(!assets.isJson(row.tags)){
                            row.tags = [];
                        }else{
                            row.tags = JSON.parse(row.tags).data;
                        }
                    }else{
                        row.tags = [];
                    }
                });

                if(err){ reject(err); }else{ resolve(results); }
            });
        });
    };

    // Return the list of components for a specific project in the environment of a workflow
    // Params :
    // - (string)id_project : The id of the project
    // [return]Promise :
    //  - (array)success : Returns the list of components
    //  - (mixed)error    : Any error that has occured
    Component.componentsForProjectForWorkflow = function(id_project, user){
        return new Promise(function(resolve, reject) {
            var id_user = userH.userIdWithVar(user);

            // Preferrably gets the forked versions of a component
            // If not gets the published version of the parent
            var promises = [];

            var published = [];
            promises.push(new Promise(function(resolve2, reject2) {
                var params = {id_project: id_project};
                    params.published = true;

                Component.find(params, function(err, results){
                    _.each(results, function(row){
                        if(row.tags){
                            if(!assets.isJson(row.tags)){
                                row.tags = [];
                            }else{
                                row.tags = JSON.parse(row.tags).data;
                            }
                        }else{
                            tags = [];
                        }
                    });

                    published = _.filter(results, function(row){
                        return row.user_id != id_user;
                    });
                    resolve2();
                });
            }));

            var forked = [];
            promises.push(new Promise(function(resolve2, reject2) {
                var params = {id_project: id_project};
                    params.is_forked = true;
                    params.user_id   = userH.userIdWithVar(user);

                Component.find(params, function(err, results){
                    _.each(results, function(row){
                        if(row.tags){
                            if(!assets.isJson(row.tags)){
                                row.tags = [];
                            }else{
                                row.tags = JSON.parse(row.tags).data;
                            }
                        }else{
                            tags = [];
                        }
                    });

                    forked = results;
                    resolve2();
                });
            }));

            var owned = [];
            promises.push(new Promise(function(resolve2, reject2) {
                var params = {id_project: id_project};
                    params.is_forked = false;
                    params.user_id   = userH.userIdWithVar(user);

                Component.find(params, function(err, results){
                    _.each(results, function(row){
                        if(row.tags){
                            if(!assets.isJson(row.tags)){
                                row.tags = [];
                            }else{
                                row.tags = JSON.parse(row.tags).data;
                            }
                        }else{
                            tags = [];
                        }
                    });

                    owned = results;
                    resolve2();
                });
            }));

            Promise.all(promises).then(function(){
                var comps = [];
                var IDsforked = _.map(forked, function(row){
                    return row.parent_fork;
                });

                _.each(published, function(row){
                    if(IDsforked.indexOf(row.id) == -1){
                        comps.push(row);
                    }else{
                        // Find the forked version and set its description to the parent description
                        _.each(forked, function(row2){
                            if(row2.parent_fork == row.id){
                                row2.description = row.description;
                            }
                        });
                    }
                });

                comps = comps.concat(forked).concat(owned);
                _.sortBy(comps, function(row){
                    return row.name;
                });

                resolve(comps);
            });
        });
    };

    // Return the amount of components for a specific project
    // Params :
    // - (string)id_project : The id of the project
    // [return]Promise :
    //  - (integer)success : Returns the amount of components
    //  - (mixed)error    : Any error that has occured
    Component.countComponentsForProjects = function(id_project){
        return new Promise(function(resolve, reject) {
            Component.count({id_project: id_project}, function(err, count){
                if(err){ reject(err); }else{ resolve(count); }
            });
        });
    };

    // Updates the properties of a component
    // Params :
    // - (object)data  : All of the properties to update with their values
    // - (string)comp_id : Id of the component to update
    // [return]Promise :
    //  - (object)success : Returns the updated object
    //  - (mixed)error    : Any error that has occured
    Component.updateComponent = function(data, comp_id){
        return new Promise(function(resolve, reject) {
            Component.componentById(comp_id).then(function(component){
                if(component){
                    _.each(Object.keys(data), function(key){
                        var dataToSave = data[key];

                        if(key == "inputs"){
                            if(Array.isArray(component.inputs)){
                                dataToSave = JSON.stringify({data: dataToSave});
                            }
                        }else{
                            if(Array.isArray(component.inputs)){
                                component.inputs = JSON.stringify({data: component.inputs});
                            }
                        }

                        if(key == "outputs"){
                            if(Array.isArray(component.outputs)){
                                dataToSave = JSON.stringify({data: dataToSave});
                            }
                        }else{
                            if(Array.isArray(component.outputs)){
                                component.outputs = JSON.stringify({data: component.outputs});
                            }
                        }

                        if(key == "tags"){
                            if(Array.isArray(component.tags)){
                                dataToSave = JSON.stringify({data: dataToSave});
                            }
                        }else{
                            if(Array.isArray(component.tags)){
                                component.tags = JSON.stringify({data: component.tags});
                            }
                        }

                        component[key] = dataToSave;
                    });

                    component.save(function(err, object){
                        if(err){ reject(err); }else{ resolve(object); }
                    });
                }else{
                    reject("Undefined component");
                }
            }, reject);
        });
    };

    // Counts how many components are owned by a user
    // Params :
    // - (string|object) user : A user id or a user object
    // [return]Promise :
    //  - (Array)success : The amount of component that the user owns
    //  - (mixed)error   : Any error that has occured
    Component.countComponentForUser = function(user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);

            Component.count({user_id: user_id, is_forked: false}, function(err, amount){
                if(err){ reject(err); }else{ resolve(amount); }
            });
        });
    };

    // Returns the list of components that are awaiting approval
    Component.componentsWaitingForApproval = function(){
        return new Promise(function(resolve, reject) {
            Component.find({approved: false, rejected: false, published: true}, function(err, results){
                if(err){ reject(err); }else{ resolve(results); }
            });
        });
    };

    // Returns the forked version of a component for a specific user
    Component.forkForComponentForUser = function(id_component, user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Component.one({user_id: user_id, parent_fork: id_component}, function(err, forked){
                if(err){
                    reject(err);
                }else{
                    resolve(forked);
                }
            });
        });
    };

    // Returns all of the forks of a user
    Component.forkForForUser = function(user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Component.find({user_id: user_id, is_forked: true}, function(err, forked){
                if(err){
                    reject(err);
                }else{
                    resolve(forked);
                }
            });
        });
    };

    // Clone a component in the repository of a user
    // - (string)id_parent: The id of the component parent
    // - (string|object) user : A user id or a user object of the user that will receive the cloned component
    Component.clone = function(id_parent, user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);

            Component.componentById(id_parent).then(function(parent){
                Component.forkForComponentForUser(id_parent, user).then(function(fork){
                    if(!fork){ // Create a new fork
                        var newObject = _.clone(parent);
                        newObject.id = undefined;

                        newObject.is_forked   = true;
                        newObject.parent_fork = parent.id;
                        newObject.user_id     = user_id;
                        newObject.published   = false;
                        if(Array.isArray(newObject.inputs)){
                            newObject.inputs = JSON.stringify({data: newObject.inputs});
                        }

                        if(Array.isArray(newObject.outputs)){
                            newObject.outputs = JSON.stringify({data: newObject.outputs});
                        }

                        Component.create(newObject, function(err, newCreated){
                            if(err){
                                reject(err);
                            }else{
                                resolve(newCreated);
                            }
                        });

                        ormLoader.model(["Project"]).then(function(d){
                            d.Project.incrementForks(newObject.id_project);
                            d.Project.projectById(newObject.id_project).then(function(project){
                                project.published = true;
                                project.save();
                            });
                        });
                    }else{ // Returns existing fork
                        resolve(fork);
                    }
                }, function(err){
                    reject(err);
                });
            });
        });
    };

    // Count the amount of components that have been forked on a specific project
    Component.countComponentsForkedWithIdProject = function(id_project){
        return new Promise(function(resolve, reject) {
            Component.count({is_forked: true, id_project: id_project}, function(err, amount){
                if(err){
                    reject(err);
                }else{
                    resolve(amount);
                }
            });
        });
    };

    // Returns the amount of contributors of a project
    Component.amountContributors = function(id_project){
        return new Promise(function(resolve, reject) {
            Component.find({id_project: id_project, is_forked: false, published: true}, function(err, components){
                var idContributors = [];
                for (var i = 0; i < components.length; i++) {
                    var comp = components[i];
                    if(idContributors.indexOf(comp.user_id) == -1){
                        idContributors.push(comp.user_id);
                    }
                }
                resolve(idContributors.length);
            });
        });
    }

    db.sync(function(){
        cb();
    });
};
