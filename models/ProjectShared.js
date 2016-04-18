var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('projectshared', {
        id_project  : { type: "text" },
        id_user     : { type: "text" },
        permissions : { type: "text" } //{own: false, edit: false, view: false}
    }, {
        timestamp      : true,
        validations    : {
            id_project : orm.enforce.required("You need to provide a project id for that ProjectShared"),
            id_user    : orm.enforce.required("You need to provide a user id for that ProjectShared"),
            permission : orm.enforce.required("You need to provide a the permission given to the use for that ProjectShared")
        },
        indexes        : {
            id_project : redis.index.discrete,
            id_user    : redis.index.discrete
        }
    });

    global.ProjectShared = db.models.projectshared;

    ///// METHODS /////

    // Find all the projects shared with a user
    ProjectShared.projectsSharedWithUser = function(user_id){
        return new Promise(function(resolve, reject){
            if(typeof(user_id) != "undefined"){
                ProjectShared.find({id_user: user_id}, function(err, results){
                    if(!err){
                        resolve(results);
                    }else{
                        reject(err);
                    }
                });
            }else{
                reject("You need to provide an ID for the user");
            }
        });
    };

    // Count the amount of projects shared with a user
    ProjectShared.countProjectsSharedWithUser = function(user_id){
        return new Promise(function(resolve, reject){
            ProjectShared.count({id_user: user_id}, function(err, amount){
                if(!err){ resolve(amount); }else{ reject(err); }
            });
        });
    };

    // Find all the members of a project alongside with their permissions
    ProjectShared.membersForProject = function(id_project){
        return new Promise(function(resolve, reject){
            ProjectShared.find({id_project: id_project}, function(err, results){
                if(!err){
                    resolve(results);
                }else{
                    reject(err);
                }
            });
        });
    };

    // Add a user has a member of a project
    ProjectShared.addMemberToProject = function(id_project, user_email_or_id, permissions){
        return new Promise(function(resolve, reject){
            ormLoader.model(["User", "Project"]).then(function(d){
                // Get the user object for the given email address
                var userObject;

                new Promise(function(resolve, reject) {
                    d.User.userByEmail(user_email_or_id).then(function(user){
                        userObject = user;
                        resolve();
                    }, function(){
                        d.User.userById(user_email_or_id).then(function(user){
                            userObject = user;
                            resolve();
                        }, function(err){
                            reject(err);
                        });
                    }, function(err){
                        reject(err);
                    });
                }).then(function(){
                    // Verify that the user is not already linked to the project
                    d.Project.ownerId(id_project).then(function(ownerId){
                        if(ownerId == userObject.id){
                            reject("You cannot add the owner again.");
                        } else {
                            ProjectShared.count({id_user: userObject.id, id_project: id_project}, function(err, countValue){
                                if(err){
                                    reject(err);
                                }else{
                                    // The user does not exists yet, we can add it to the project
                                    if(!countValue){
                                        ProjectShared.create({
                                            id_project  : id_project,
                                            id_user     : userObject.id,
                                            permissions : JSON.stringify(permissions)
                                        }, function(err){
                                            if(!err){
                                                resolve(userObject.id);
                                            }else{
                                                reject(err);
                                            }
                                        });
                                    }else{ // User is already linked to the project
                                        resolve();
                                    }
                                }
                            });
                        }
                    });
                });
            });
        });
    };

    ProjectShared.removeMemberFromProject = function(id_project, id_team_member){
        return new Promise(function(resolve, reject){
            ormLoader.model("Project").then(function(Project){
                Project.projectById(id_project).then(function(project){
                    // Trying to remove the owner of the project from the list of allowed users
                    if(project.user_id == id_team_member){
                        reject("You cannot remove the owner of the project from the member list");
                    }else{
                        ProjectShared.one({id_user: id_team_member, id_project: id_project}, function(err, user){
                            if(user){
                                user.remove(function(err){
                                    if(!err){
                                        resolve();
                                    }else{
                                        reject(err);
                                    }
                                });
                            }else{
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    };

    ProjectShared.permissionsForUserForProject = function(id_user, id_project){
        return new Promise(function(resolve, reject){
            ormLoader.model("Project").then(function(Project){
                Project.projectById(id_project).then(function(project){
                    // The user is the owner of the project
                    if(project.user_id == id_user){
                        resolve({
                            edit: true,
                            view: true,
                            own : true
                        });
                    }else{
                        ProjectShared.one({id_project: id_project, id_user: id_user}, function(err, object){
                            if(err){
                                reject(err);
                            }else{
                                if(object){
                                    resolve(object.permissions);
                                }else{
                                    resolve(false);
                                }
                            }
                        });
                    }
                }, function(err){
                    reject(err);
                });
            });
        });
    };

    ProjectShared.changeMemberPermissions = function(id_team_member, id_project, permissions){
        return new Promise(function(resolve, reject){
            ormLoader.model("Project").then(function(Project){
                Project.projectById(id_project).then(function(project){
                    // Trying to remove the owner of the project from the list of allowed users
                    if(project.user_id == id_team_member){
                        reject("You cannot remove the owner of the project from the member list");
                    } else {
                        if(permissions.own){
                            var previousOwnerID = project.user_id;
                            // Remove the user as a user linked before changing permissions
                            ProjectShared.removeMemberFromProject(id_project, id_team_member).then(function(){
                                // Set the user as the owner of the project
                                Project.setOwnerForProject(id_team_member, id_project).then(function(){
                                    // Add previous owner to ProjectShared
                                    User.userById(previousOwnerID).then(function(previous_owner){
                                        ProjectShared.addMemberToProject(id_project, previous_owner.email, {
                                            view : true,
                                            edit : true,
                                            own  : false
                                        }).then(function(){
                                            resolve();
                                        }, function(err){
                                            reject(err);
                                        });
                                    }, function(err){
                                        reject(err);
                                    });
                                }, function(err){
                                    reject(err);
                                });
                            }, function(err){
                                reject(err);
                            });
                        } else {
                            ProjectShared.one({id_user: id_team_member, id_project:id_project}, function(err, user){
                                if(user){
                                    user.permissions = JSON.stringify(permissions);
                                    user.save(function(err){
                                        if(!err){
                                            resolve();
                                        }else{
                                            reject(err);
                                        }
                                    });
                                } else {
                                    resolve();
                                }
                            });
                        }
                    }
                })
            })
        });
    };

    db.sync(function(){
        cb();
    });
};
