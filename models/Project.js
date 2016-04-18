var redis            = require('node-orm2-redis');
var path             = require('path');
var stringSimilarity = require('string-similarity');
var orm              = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter  = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader        = require(path.normalize(__dirname + '/../helpers/orm'));
var userH            = require(path.normalize(__dirname + '/../helpers/user'));
var _                = require('underscore');

module.exports = function (db, cb) {
    db.define('project', {
        published   : { type: "boolean", defaultValue: false   },
        name        : { type: "text"                           },
        icon        : { type: "text", defaultValue   : ''      },
        url         : { type: "text", defaultValue   : 'https://images.synchronise.io/defaultProjectIcon.png' },
        description : { type: "text"                           },
        user_id     : { type: "text"                           },
        /* THESE ARE ONLY COSMETICS FOR DISPLAY ON THE STORE AND ELSEWHERE*/
        bg_color    : { type: "text", defaultValue   : "white" },
        txt_color   : { type: "text", defaultValue   : "black" },
        icon_flts   : { type: "text", defaultValue   : ""      },
        forks       : { type: "number", defaultValue : 0       },
        community   : { type: "boolean", defaultValue: false   } // Determine whether or not the community can contribute to the project, if true anyone can add and edit components
    }, {
        timestamp   : true,
        validations : {
            name : orm.enforce.required("You need to provide a name for that Project")
        },
        indexes : {
            name      : redis.index.discrete,
            user_id   : redis.index.discrete,
            forks     : redis.index.discrete,
            published : redis.index.discrete,
            community : redis.index.discrete
        }
    });

    global.Project = db.models.project;

    ///// METHODS /////
    Project.allProjectsOrderedByCreationDate = function(){
        return new Promise(function(resolve, reject) {
            Project.find({published: true}, function(err, projects){
                resolve(projects);
            });
        });
    };

    Project.createProject = function(data){
        return new Promise(function(resolve, reject) {
            Project.create(data, function(err, project){
                if(err){ reject(err); }else{ resolve(project); }
            });
        });
    };

    // [Object|String] user : this must be a user object or an ID of user
    Project.projectsForUser = function(user){
        var id_user = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject){
            var projects = [];
            var promises = [];

            // Get the projects the user owns
            promises.push(new Promise(function(resolveLocal, rejectLocal){
                Project.find({user_id: id_user}, function(err, results){
                    if(!err){
                        var projectsLocal = results;

                        // Set the permission of the project to FULL (owned by the user)
                        _.each(projectsLocal, function(project){
                            project.permissions = {
                                own   : true,
                                view  : true,
                                edit  : true
                            };
                        });

                        projects = _.union(projects, projectsLocal);

                        resolveLocal();
                    }else{
                        rejectLocal(err);
                    }
                });
            }));

            // Get the project that have been shared with the user
            promises.push(new Promise(function(resolveLocal, rejectLocal){
                ormLoader.model("ProjectShared").then(function(ProjectShared){
                    ProjectShared.projectsSharedWithUser(id_user).then(function(results){
                        var projectsLocal = results;
                        var promisesLocal = [];

                        _.each(projectsLocal, function(project){
                            // Get each Project's object
                            promisesLocal.push(new Promise(function(resolveProjectPromise, rejectProjectPromise){
                                Project.projectById(project.id_project).then(function(projectFound){
                                    // Set the permissions of each project as given
                                    var modifiedProject = projectFound;
                                        modifiedProject.permissions = JSON.parse(project.permissions);
                                    projects.push(modifiedProject);
                                    resolveProjectPromise();
                                }, function(err){
                                    rejectProjectPromise(err);
                                });
                            }));
                        });

                        Promise.all(promisesLocal).then(function(){
                            resolveLocal();
                        }, function(){
                            rejectLocal();
                        });
                    }, function(err){
                        rejectLocal(err);
                    });
                });
            }));

            Promise.all(promises).then(function(){
                // Sort the project by date of creation
                var sortedResults = _.sortBy(projects, function(project){
                    return project.created_at;
                });
                resolve(objectFormatter.format(sortedResults));
            }, function(err){
                reject(err);
            });

        });
    };

    Project.projectsForUserWithForked = function(user){
        return new Promise(function(resolve, reject) {
            var id_user = userH.userIdWithVar(user);
            var projects = [];
            var IDsProjectsAlreadyInArray = [];

            // Collects the projects of the user
            Project.projectsForUser(id_user).then(function(projs){
                projects = projs;
                IDsProjectsAlreadyInArray = _.map(projs, function(row){
                    return row.id;
                });

                ormLoader.model(["Component"]).then(function(d){
                    d.Component.forkForForUser(id_user).then(function(forked){
                        var IDsProjectsToAddFromForked = [];

                        _.each(forked, function(row){
                            if(IDsProjectsAlreadyInArray.indexOf(row.id_project) == -1){
                                IDsProjectsToAddFromForked.push(row.id_project);
                                IDsProjectsAlreadyInArray.push(row.id_project);
                            }
                        });

                        var promises = [];
                        _.each(IDsProjectsToAddFromForked, function(row){
                            promises.push(new Promise(function(resolve2, reject2) {
                                Project.projectById(row).then(function(object){
                                    projects.push(object);
                                    resolve2();
                                });
                            }));
                        });

                        Promise.all(promises).then(function(){
                            resolve(projects);
                        });
                    });
                });
            });
        });
    };

    // Count how many projects the user is associated to or owns
    Project.countProjectsForUser = function(user){
        var id_user = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject){
            var promises = [];
            var amount = 0;

            // Get the projects the user owns
            promises.push(new Promise(function(resolveLocal, rejectLocal){
                Project.count({user_id: id_user}, function(err, amountFound){
                    if(!err){
                        amount+=amountFound;
                        resolveLocal();
                    }else{
                        rejectLocal(err);
                    }
                });
            }));

            // Get the project that have been shared with the user
            promises.push(new Promise(function(resolveLocal, rejectLocal){
                ormLoader.model("ProjectShared").then(function(ProjectShared){
                    ProjectShared.countProjectsSharedWithUser(id_user).then(function(amountFound){
                        amount+=amountFound;
                        resolveLocal();
                    }, function(err){
                        rejectLocal(err);
                    });
                });
            }));

            Promise.all(promises).then(function(){
                resolve(amount);
            }, function(err){
                reject(err);
            });
        });
    };

    // Returns all of the members of a project
    Project.teamMembersForProject = function(id_project){
        return new Promise(function(resolve, reject){
            var promises = [];
            var members = [];

            // Collect information for the owner of the project
            promises.push(new Promise(function(resolveLocal, rejectLocal){
                Project.projectById(id_project).then(function(project){
                    ormLoader.model("User").then(function(User){
                        User.userById(project.user_id).then(function(owner){
                            members.push({
                                name        : owner.name,
                                email       : owner.email,
                                id          : owner.id,
                                permissions : {
                                    view : true,
                                    edit : true,
                                    own  : true
                                }
                            });
                            resolveLocal();
                        }, function(err){
                            rejectLocal(err);
                        });
                    });
                }, function(err){
                    rejectLocal(err);
                });
            }));

            // Collect information for all of the other members of the Project
            promises.push(new Promise(function(resolveLocal, rejectLocal){
                ormLoader.model(["ProjectShared", "User"]).then(function(d){
                    d.ProjectShared.membersForProject(id_project).then(function(membersFound){
                        var promisesLocal = [];

                        _.each(membersFound, function(currentMember){
                            promisesLocal.push(new Promise(function(resolveSubLocal, rejectSubLocal){
                                d.User.userById(currentMember.id_user).then(function(user){
                                    members.push({
                                        name        : user.name,
                                        email       : user.email,
                                        id          : user.id,
                                        permissions : JSON.parse(currentMember.permissions)
                                    });
                                    resolveSubLocal();
                                }, function(err){
                                    // The user no longer exists
                                    currentMember.remove(function(err){
                                        resolveSubLocal();
                                    });
                                });
                            }));
                        });

                        Promise.all(promisesLocal).then(function(){
                            resolveLocal();
                        }, function(){
                            rejectLocal();
                        });
                    });
                });
            }));

            Promise.all(promises).then(function(){
                resolve(members);
            }, function(err){
                reject(err);
            });
        });
    };

    Project.permissionsOfUserForProject = function(id_user, id_project){
        return new Promise(function(resolve, reject){
            Project.projectById(id_project).then(function(project){
                // The user is the owner of the project
                if(project.user_id == id_user){
                    resolve({
                        own  : true,
                        edit : true,
                        view : true
                    });
                }else{ // The user is not the owner of the project
                    // Try to see if the user has some permissions to the project
                    ormLoader.model("ProjectShared").then(function(ProjectShared){
                        ProjectShared.permissionsForUserForProject(id_user, id_project).then(function(permissions){
                            if(permissions){
                                resolve(permissions);
                            }else{
                                resolve({
                                    own  : false,
                                    edit : false,
                                    view : false
                                });
                            }
                        }, function(err){
                            reject(err);
                        });
                    });
                }
            }, function(err){
                reject(err);
            });
        });
    };

    Project.projectById = function(idGiven){
        return new Promise(function(resolve, reject){
            Project.one({id:idGiven}, function(err, project){
                if(!err){
                    resolve(project);
                }else{
                    reject(err);
                }
            });
        });
    };

    Project.setOwnerForProject = function(id_user, id_project){
        return new Promise(function(resolve, reject){
            Project.one({id: id_project}, function(err, project){
                project.user_id = id_user;
                project.save(function(err){
                    if(!err){
                        resolve();
                    }else{
                        reject(err);
                    }
                });
            });
        });
    };

    // Returns the list of queries for a project
    Project.queries = function(project, data){
        return new Promise(function(resolve, reject){
            ormLoader.model("Query").then(function(Query){
                Query.find({project_id: project.id}, function(err, results){
                    if(err){
                        reject(err);
                    }else{
                        if(typeof(data) != "undefined"){
                            if(typeof(data.skip) != "undefined"){
                                results = results.slice(data.skip, results.length); // SKIP
                            }

                            if(typeof(data.limit) != "undefined"){
                                results = results.slice(0, data.limit); // LIMIT
                            }

                            if(typeof(data.orderField) != "undefined"){
                                results = _.order(results, function(row){
                                    return row[data.orderField];
                                });
                            }

                            if(typeof(data.order) != "undefined"){
                                if(data.order == "descending"){
                                    results = results.reverse();
                                }
                            }
                        }
                        resolve(objectFormatter.format(results));
                    }
                });
            });
        });
    };

    // Count the amount of queries for a project
    // Params :
    // - [string|object]project : either the project id or the project object
    Project.queriesCount = function(project){
        return new Promise(function(resolve, reject){
            ormLoader.model("Query").then(function(Query){
                var projectId;

                if(typeof(project) == "object"){
                    projectId = project.id;
                }else{
                    projectId = project;
                }

                Query.count({
                    project_id : projectId
                }, function(err, results){
                    if(!err){
                        resolve(results);
                    }else{
                        reject(err);
                    }
                });
            });
        });
    };

    // Returns the figures associated to a project
    Project.figures = function(project){
        return new Promise(function(resolve, reject){
            ormLoader.model("Figure").then(function(Figure){
                Figure.find({project_id:project.id}, function(err, results){
                    if(!err){
                        resolve(results);
                    }else{
                        reject(err);
                    }
                });
            });
        });
    };

    // Returns the owner ID of a project
    Project.ownerId = function(id_project){
        return new Promise(function(resolve, reject){
            Project.one({id: id_project}, function(err, project){
                if(!err){
                    resolve(project.user_id);
                }else{
                    reject(err);
                }
            });
        });
    };

    // Search all the projects matching a name
    // - (string)search: The string to search for
    // - (bool)shouldBePublished: Wether to check if the project is published or not.
    // If true will only return projects that are published,
    // if false will only return project that are not published,
    /// if not given then returns all projects with the matching name regardless of their publicaton status
    Project.searchWithName = function(search, shouldBePublished){
        return new Promise(function(resolve, reject) {
            var parameters = {};
            if(typeof(shouldBePublished) != "undefined"){
                parameters.published = shouldBePublished;
            }

            Project.find(parameters, function(err, projects){
                var matching = _.filter(projects, function(row){
                    if(row){
                        if(row.name){
                            var similarity = stringSimilarity.compareTwoStrings(search, row.name);
                            return (similarity>0.5 || (row.name.toLowerCase().indexOf(search.toLowerCase()) !== -1));
                        }else{
                            return false;
                        }
                    }else{
                        return false;
                    }
                });

                resolve(matching);
            });
        });
    };

    // Returns the list of last published projects in th marketplace
    Project.lastPublishedProjects = function(){
        return new Promise(function(resolve, reject) {
            Project.find({published: true}, 10, ["created_at", "Z"], function(err, projects){
                if(err){ reject(err); }else{
                    var results = _.filter(projects, function(project){
                        return project.published;
                    });

                    _.sortBy(results, function(row){
                        return row.created_at;
                    });

                    results.reverse();

                    resolve(results);
                }
            });
        });
    };

    Project.incrementForks = function(id_project){
        return new Promise(function(resolve, reject) {
            Project.projectById(id_project).then(function(project){
                project.forks = parseInt(project.forks)+1;
                project.save(function(err){
                    if(err){reject(err);}else{resolve();}
                });
            });
        });
    };

    // Returns the list of the most popular project by amount of forks
    Project.mostPopularProjects = function(){
        return new Promise(function(resolve, reject) {
            Project.find({published: true}, ["forks", "Z"], 10, function(err, projects){
                if(err){reject(err);}else{resolve(_.filter(projects, function(project){
                    return project.published;
                }));}
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
