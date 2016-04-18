var path    = require('path');
var orm     = require(path.normalize(__dirname + '/../helpers/orm'));
var Promise = require('promise');
var _       = require('underscore');

// Returns the list of users, the current user is connect to (like friends)
// Params
// - (string)user_id: optional, if there is no user_id then it'll get the user_id from the user session
// - (string)user_object: optional, if true then the function will return User objects containing name, email and id instead of IDs
exports.getUserConnections = function(request, response){
    var return_user_objects = request.params.user_object || false;
    var promises = [];

    orm.model(["UserConnection", "User"]).then(function(d){
        var user = d.User.current(request);

        d.UserConnection.getUserConnections(user.id).then(function(connections){
            if(return_user_objects){
                var returned_connections = [];
                _.each(connections, function(connection){
                    promises.push(new Promise(function(resolve){
                        d.User.userById(connection.connection).then(function(user){
                            var temp_user = {
                                "name": user.name,
                                "email": user.email,
                                "id:": user.id
                            };

                           returned_connections.push(temp_user);
                            resolve();
                        });
                    }));
                });

                Promise.all(promises).then(function(){
                    response.success(returned_connections);
                });
            } else {
                response.success(connections);
            }
        }, function(err){
            response.error(err);
        });
    });
};

// Associate a user to another user. The order in which the users are associated is not important
// Params
// - (string)user_id_1: The first user
// - (string)user_id_2: The second user
exports.addUserConnection = function(request, response){
    orm.model(["UserConnection"]).then(function(UserConnection){
        var user_id_1 = request.params.user_id_1;
        var user_id_2 = request.params.user_id_2;

        UserConnection.addUserConnection(user_id_1, user_id_2).then(function(){
            response.success();
        }, function(err){
            response.error(err);
        });
    });
};

// Dissociate two users. The order in which the users are Dissociated is not important
// Params
// - (string)user_id_1: The first user
// - (string)user_id_2: The second user
exports.deleteUserConnection = function(request, response){
    orm.model(["UserConnection"]).then(function(UserConnection){
        var user_id_1 = request.params.user_id_1;
        var user_id_2 = request.params.user_id_2;

        UserConnection.deleteUserConnection(user_id_1, user_id_2).then(function(){
            response.success();
        }, function(err){
            response.error(err);
        });
    });
};

// Remove all connections for a specific user
// Params
// - (string)user_id: The ID of the user
exports.deleteAllUserConnections = function(request, response){
    orm.model(["UserConnection"]).then(function(UserConnection){
        var user_id = request.params.user_id;

        UserConnection.deleteAllUserConnections(user_id).then(function(){
            response.success();
        }, function(err){
            response.error(err);
        });
    });
};

// Returns the amount of referrals the user has successfully created (i.e the user has signed up after being referred)
exports.countReferrals = function(request, response){
    orm.model(["User"]).then(function(d){
        d.User.countReferrals(d.User.current(request)).then(function(amount){
            response.success(amount);
        }, function(err){
            response.error(err);
        });
    });
}
