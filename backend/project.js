// Everything related to managing projects
var path            = require('path');
var userH           = require(path.normalize(__dirname + '/../helpers/user'));
var orm             = require(path.normalize(__dirname + '/../helpers/orm'));
var assets          = require(path.normalize(__dirname + '/../helpers/assets'));
var Promise         = require('promise');
var _               = require('underscore');

// Return the list of projects for a user
exports.projectList = function(request, response){
    orm.model(["User", "Project"]).then(function(d){
        var user = d.User.current(request);

        d.Project.projectsForUser(user).then(function(projects){
            response.success(_.sortBy(projects, function(row){
                return row.name;
            }));
        }, response.error);
    });
};

// Return the list of projects for a user including the list of components
exports.projectsListWithComponents = function(request, response){
    orm.model(["User", "Project", "Component"]).then(function(d){
        var user = d.User.current(request);

        d.Project.projectsForUser(user).then(function(projects){
            var projectsLeft = [];
            var promises = [];

            _.each(projects, function(row){
                promises.push(new Promise(function(resolve, reject) {
                    d.Component.countComponentsForProjects(row.id).then(function(amount){
                        if(amount){ projectsLeft.push(row); }
                        resolve();
                    }, reject);
                }));
            });

            Promise.all(promises).then(function(){
                response.success(projectsLeft);
            });
        }, response.error);
    });
};

// Same as above but will also return the project the user does not own, but has forked a component oof the project
exports.projectsListWithComponentsForWorkflow = function(request, response){
    orm.model(["User", "Project", "Component"]).then(function(d){
        var user = d.User.current(request);

        d.Project.projectsForUserWithForked(user).then(function(projects){
            var projectsLeft = [];
            var promises = [];

            _.each(projects, function(row){
                promises.push(new Promise(function(resolve, reject) {
                    d.Component.countComponentsForProjects(row.id).then(function(amount){
                        if(amount){ projectsLeft.push(row); }
                        resolve();
                    }, reject);
                }));
            });

            Promise.all(promises).then(function(){
                response.success(projectsLeft);
            });
        }, response.error);
    });
};

// Add or a update the data of a project
// Params
// - (string|undefined)id: The if of the project
// Various parameters sent from the client that are not specifically defined here
exports.addUpdateProject = function(request, response){
    orm.model(["User", "Project", "ProjectShared"]).then(function(d){
        var user = d.User.current(request);
        var params = _.extend({user_id: user.id}, request.params);

        var projectId = request.params.id_project;
        var promises = [];
        var IDsToPingAtTheEnd = [];

        // NEW PROJECT -> CREATE
        if(!projectId){
            d.Project.createProject(params).then(function(project){
                assets.intercomTrackEvent("createdProject", user.id);
                response.success(project, 200, {}, [user.id]);
            }, function(err){
                response.error('An error occured while saving the project, please try again.');
            });
        }else{ // EXISTING PROJECT -> UPDATE
            promises.push(new Promise(function(resolve){
                d.Project.teamMembersForProject(projectId).then(function(members){
                    _.each(members, function(item){
                        IDsToPingAtTheEnd.push(item.id);
                    });
                    resolve();
                });
            }));

            Promise.all(promises).then(function(){
                d.Project.projectById(projectId).then(function(project){
                    _.each(Object.keys(params), function(key){
                        project[key] = params[key];
                    });

                    project.save(function(err){
                        if(!err){
                            response.success(project, 200, {id_project: projectId}, IDsToPingAtTheEnd);
                        }else{
                            response.error('An error occured while saving the project, please try again.');
                        }
                    });
                }, function(err){
                    response.error('An error occured while saving the project, please try again.');
                });
            });
        }
    });
};

// Get a project with its ID
// Params
// - (string)id_project: The id of the project
exports.getProject = function(request, response){
    orm.model(["Project", "User"]).then(function(d){
        userH.isAllowedThisBackend(request, function(isAllowedBecauseAdmin){
            var user        = d.User.current(request);
            var id_project  = request.params.id_project;
            var authorized  = isAllowedBecauseAdmin;
            var id_user;
            if(user){
                id_user = user.id;
            }
            var promises    = [];

            if(id_user){
                promises.push(new Promise(function(resolve, reject){
                    d.Project.teamMembersForProject(id_project).then(function(members){
                        _.each(members, function(member){
                            if(member.id == id_user || isAllowedBecauseAdmin){
                                authorized = true;
                            }
                        });
                        resolve();
                    });
                }));
            }

            Promise.all(promises).then(function(){
                d.Project.projectById(id_project).then(function(project){
                    if(project.published){
                        authorized = true;
                    }

                    if(!authorized){
                        response.error('You cannot retrieve a project in which you do not belong.');
                    }else{
                        response.success(project);
                    }

                }, function(err){
                    response.error(err);
                });
            });
        }, ["marketplace"]);
    });
};

// Returns the list of members of a project
// Params
// - (string)id_project: The id of the project
exports.teamMembersForProject = function(request, response){
    orm.model(["User", "Project"]).then(function(d){
        var user = d.User.current(request);

        var id_user = user.id;
        var id_project = request.params.id_project;
        var authorized = false;

        d.Project.teamMembersForProject(id_project).then(function(members){
            _.each(members, function(member){
                if(member.id == id_user){
                    authorized = true;
                }
            });

            if(!authorized){
                response.error('You cannot retrieve the team members for a project in which you do not belong.');
                reject('You cannot retrieve the team members for a project in which you do not belong.');
            } else {
                response.success(members);
            }
        }, function(err){
            response.error(err);
        });
    });
};

// Remove a project
// Params
// - (string)id_project: The id of the project
exports.removeProject = function(request, response){
    orm.model(["User", "Project", "ProjectShared"]).then(function(d){
        var user              = d.User.current(request);
        var projectId         = request.params.id_project;
        var project;
        var canContinue       = true;
        var projectName       = "";
        var promises          = [];
        var IDsToPingAtTheEnd = [];
        var id_user           = user.id;

        new Promise(function(resolve, reject){
            d.Project.one({id: projectId}, function(err, projectFound){
                if(!err && projectFound.user_id == id_user){
                    project = projectFound;

                    // We  set that we want to ping the owner of the project at then end
                    IDsToPingAtTheEnd.push(project.user_id);
                    resolve(project);
                }else{
                    canContinue = false;
                    response.error('An error occured while trying to fetch the project, please try again.');
                    reject('An error occured while trying to fetch the project, please try again.');
                }
            });
        }).then(function(){
            if(canContinue){
                promises.push(new Promise(function(resolve){
                    d.ProjectShared.membersForProject(projectId).then(function(members){
                        var promisesLocal = [];
                        _.each(members, function(member){
                            IDsToPingAtTheEnd.push(member.id_user);
                            promisesLocal.push(new Promise(function(resolveLocal){
                                member.remove(function(){
                                    resolveLocal();
                                });
                            }));
                        });
                        Promise.all(promisesLocal).then(resolve);
                    });
                }));
            }
        }).then(function(){
            return Promise.all(promises);
        }).then(function(){
            if(canContinue){
                project.remove(function(err){
                    if(!err){
                        response.success("Project " + projectName + " removed", 200, {}, IDsToPingAtTheEnd);
                    }else{
                        response.error(err);
                    }
                });
            }
        });
    });
};

// Associate a new member to the project
// Params
// - (string)id_project: The id of the project
// - (string)searchString: The email of a user, because we can associate either by ID or email
// - (object)permissions: The permissions to give to the user
exports.addMemberToProject = function(request, response){
    orm.model(["User", "Project", "ProjectShared"]).then(function(d){
        var user = d.User.current(request);

        var id_project  = request.params.id_project;
        var searchEmail = request.params.searchString;
        var id_user     = user.id; // Id of the user trying to associate another user
        var permissions = request.params.permissions;
        var promises    = [];
        var IDsToPingAtTheEnd = [];

        promises.push(new Promise(function(resolve){
            d.Project.ownerId(id_project).then(function(ownerId){
                IDsToPingAtTheEnd.push(ownerId);
                resolve();
            });
        }));

        promises.push(new Promise(function(resolve){
            d.ProjectShared.membersForProject(id_project).then(function(members){
                _.each(members, function(item){
                    IDsToPingAtTheEnd.push(item.id_user);
                });
                resolve();
            });
        }));

        Promise.all(promises).then(function(){
            // Verify if the current user is allowed to associate a new member to the project
            d.Project.permissionsOfUserForProject(id_user, id_project).then(function(permissionsOfUserAskingQuery){
                var canChangePermissions = false;
                if(permissionsOfUserAskingQuery.own || permissionsOfUserAskingQuery.edit){
                    if(permissions.own){ // The user wants to set someone else as the owner
                        if(permissionsOfUserAskingQuery.own){ // The user is the owner and can do this
                            canChangePermissions = true;
                        }
                    }else{
                        canChangePermissions = true;
                    }
                }

                if(canChangePermissions){
                    // We can finaly associate the email/user to the project
                    d.ProjectShared.addMemberToProject(id_project, searchEmail, permissions).then(function(id_user_new){
                        orm.model("UserConnection").then(function(UserConnection){
                            _.each(IDsToPingAtTheEnd, function(id){
                                UserConnection.addUserConnection(id, id_user_new);
                            });
                        });

                        response.success("", 200, {}, IDsToPingAtTheEnd);
                    }, function(err){
                        response.error(err);
                    });
                }else{
                    response.error("You are not allowed to modify the permissions of that project");
                }
            }, function(err){
                response.error(err);
            });
        });
    });
};

// Remove a member from a project
// Params
// - (string)id_project: The id of the project the member is in
// - (string)id_team_member: the id of the team member
exports.removeTeamMemberFromProject = function(request, response){
    orm.model(["User", "Project", "ProjectShared"]).then(function(d){
        var user = d.User.current(request);

        var id_project     = request.params.id_project;
        var id_team_member = request.params.id_team_member;
        var id_user        = user.id;

        var IDsToPingAtTheEnd = [];
        var promises = [];

        // Getting ID of the owner
        promises.push(new Promise(function(resolve){
            d.Project.teamMembersForProject(id_project).then(function(members){
                _.each(members, function(item){
                    IDsToPingAtTheEnd.push(item.id);
                });
                resolve();
            });
        }));

        Promise.all(promises).then(function(){
            d.ProjectShared.permissionsForUserForProject(id_user, id_project).then(function(permissions){
                // Verify is the current user is allowed to remove a member from the project
                if(permissions.edit || permissions.own){
                    // Removes the member from the project
                    d.ProjectShared.removeMemberFromProject(id_project, id_team_member).then(function(){
                        response.success("", 200, {id_project: id_project}, IDsToPingAtTheEnd);
                    }, function(err){
                        response.error(err);
                    });
                }else{
                    response.error("You are not allowed to remove a member from that project");
                }
            }, function(err){
                reject(err);
            });
        });
    });
};

// The user wants to leave a project
// Params
// - (string)id_project
exports.leaveProject = function(request, response){
    orm.model(["User", "Project", "ProjectShared"]).then(function(d){
        var user = d.User.current(request);

        var id_project     = request.params.id_project;
        var id_user        = user.id;

        var promises = [];
        var IDsToPingAtTheEnd = [];

        promises.push(new Promise(function(resolve){
            d.Project.ownerId(id_project).then(function(ownerId){
                IDsToPingAtTheEnd.push(ownerId);
                resolve();
            });
        }));

        Promise.all(promises).then(function(){
            // Verify if the user is in the project team
            d.ProjectShared.membersForProject(id_project).then(function(members){
                var isInProject = false;
                _.each(members, function(member){
                    if(id_user == member.id_user){
                        isInProject = true;
                    } else {
                        IDsToPingAtTheEnd.push(member.id_user);
                    }
                });

                if(isInProject){
                    // Verify that the user isn't the owner
                    d.ProjectShared.permissionsForUserForProject(id_user, id_project).then(function(permissions){
                        if(!permissions.own){
                            // Actually remove the member from the project
                            d.ProjectShared.removeMemberFromProject(id_project, id_user).then(function(){
                                response.success("", 200, {id_project : id_project}, [id_user]);
                            });
                        } else {
                            response.error("You can't leave a project that you own, you have to delete it.");
                        }
                    });
                } else {
                    response.error("You can't leave a project to which you do not belong.");
                }
            }, function(err){
                reject(err);
            });
        });
    });
};

exports.changeMemberPermissionsForProject = function(request, response){
    orm.model(["User", "Project", "ProjectShared"]).then(function(d){
        var user = d.User.current(request);

        var id_project        = request.params.id_project;
        var id_team_member    = request.params.id_team_member;
        var permissions       = request.params.permissions;
        var id_user           = user.id;
        var promises          = [];
        var IDsToPingAtTheEnd = [];

        promises.push(new Promise(function(resolve){
            d.Project.teamMembersForProject(id_project).then(function(members){
                _.each(members, function(item){
                    IDsToPingAtTheEnd.push(item.id_user);
                });
                resolve();
            });
        }));

        promises.push(new Promise(function(resolve, reject){
            d.ProjectShared.permissionsForUserForProject(id_user, id_project).then(function(permissionsActualUser){
                // Verify is the current user is allowed to change the permissions
                if(permissionsActualUser.own){
                    // If we are changing the owner, first give the new owner his owner rights as in Project.id_user, then
                    // add the previous owner in ProjectShared with the Edit permissions
                    d.ProjectShared.changeMemberPermissions(id_team_member, id_project, permissions).then(function(){
                        response.success("", 200, {id_project : id_project}, IDsToPingAtTheEnd);
                    }, function(err){
                        response.error(err);
                    });
                } else {
                    response.error("You need to be the owner to change other members' permissions.");
                }
            }, function(err){
                reject(err);
            });
        }));

        Promise.all(promises).then(function(){
            resolve(permissions);
        }, function(err){
            reject(err);
        });
    });
};

// Returns the amount of projects owned by the user or shared with him
exports.countProject = function(request, response){
    orm.model(["User", "Project"]).then(function(d){
        var user = d.User.current(request);

        d.Project.countProjectsForUser(user.id).then(function(amount){
            response.success(amount);
        }, function(err){
            response.error(err);
        });
    });
};

// allows to clean a user's broken projects and links to projects
exports.deleteBrokenProjects = function(request, response){
    orm.model(["ProjectShared", "User"]).then(function(ProjectShared){
        var id_user = d.User.current(request).id;
        response.success(id_user);

        d.ProjectShared.projectsSharedWithUser(id_user).then(function(results){
            _.each(results, function(project){
                // Get each Project's object
                d.ProjectShared.removeMemberFromProject(project.id_project, id_user);
            });
        });
    });
};
