/**
 * Created by Michel on 21/09/2015.
 */
var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var urlBodyParser   = require(path.normalize(__dirname + '/../helpers/urlBodyParser'));
var _               = require('underscore');

module.exports = function (db, cb) {
    db.define('userconnection', {
        user_id     : { type: "text" },
        connection  : { type: "text" }
    }, {
        indexes : {
            user_id : redis.index.discrete,
            connection: redis.index.discrete
        }
    });
// TODO: put the backend methods into the model.
    global.UserConnection = db.models.userconnection;

    // [String] user_id : ID of user
    // get all of the connections of one user
    UserConnection.getUserConnections = function(user_id){
        return new Promise(function(resolve, reject) {
            UserConnection.find({user_id: user_id}, function(err, userConnections){
                if(!err){
                    resolve(objectFormatter.format(userConnections));
                } else {
                    reject(err);
                }

            });
        });
    };

    // [String] user_id_1 : ID of user 1
    // [String] user_id_2 : ID of user 2
    // (the order of the user IDs don't matter)
    // Get the connection between 2 users
    UserConnection.getUsersConnection = function(user_id_1, user_id_2){
        return new Promise(function(resolve, reject) {
            UserConnection.one({
                user_id: user_id_1,
                connection: user_id_2
            }, function(err, connection){
                if(!err){
                    resolve(connection);
                } else {
                    reject(err);
                }

            });
        });
    };

    // [String] user_id_1 : ID of user 1
    // [String] user_id_2 : ID of user 2
    // (the order of the user IDs don't matter)
    // Add a connection between 2 users
    UserConnection.addUserConnection = function(user_id_1, user_id_2){
        return new Promise(function(resolve, reject){
            UserConnection.getUsersConnection(user_id_1, user_id_2).then(function(connection){
                if(connection == null){
                    UserConnection.create({
                        user_id    : user_id_1,
                        connection : user_id_2
                    }, function(err, connection){
                        if(!err){
                            console.log("added conection 1");
                        } else {
                            reject(err);
                        }
                    });
                } else {
                    console.log("not added connection 1 again");
                }

            });

            UserConnection.getUsersConnection(user_id_2, user_id_1).then(function(connection){
                if(connection == null){
                    UserConnection.create({
                        user_id    : user_id_2,
                        connection : user_id_1
                    }, function(err, connection){
                        if(!err){
                            console.log("added conection 2");
                        } else {
                            reject(err);
                        }
                    });
                } else {
                    console.log("not added connection 2 again");
                }

            });
            resolve();
        });
    };

    // [String] user_id_1 : ID of user 1
    // [String] user_id_2 : ID of user 2
    // (the order of the user IDs don't matter)
    // Delete the connection between 2 users
    UserConnection.deleteUserConnection = function(user_id_1, user_id_2){
        return new Promise(function(resolve, reject){
            UserConnection.getUsersConnection(user_id_1, user_id_2).then(function (connection) {
                if(connection != null){
                    UserConnection.one({
                        user_id: user_id_1,
                        connection: user_id_2
                    }, function(err, connection){
                        if(!err){
                            connection.remove(function(){
                            })
                        } else {
                            console.log("Problem during the deletion of a connection. (1)");
                            reject(err);
                        }
                    });
                } else {
                    console.log("connection 1 doesn't exist, can't delete");
                    reject();
                }

            }, function (err) {
                reject(err);
            });

            UserConnection.getUsersConnection(user_id_2, user_id_1).then(function (connection) {
                if(connection != null){
                    UserConnection.one({
                        user_id: user_id_2,
                        connection: user_id_1
                    }, function(err, connection){
                        if(!err){
                            connection.remove(function(){
                            })
                        } else {
                            console.log("Problem during the deletion of a connection. (2)");
                            reject(err);
                        }
                    });
                } else {
                    console.log("connection 2 doesn't exist, can't delete");
                    reject();
                }
            }, function (err) {
                reject(err);
            });
            resolve();
        });
    };

    UserConnection.deleteAllUserConnections = function(user_id){
        return new Promise(function(resolve, reject){
            UserConnection.getUserConnections(user_id).then(function(connections){
                _.each(connections, function(connection){
                    UserConnection.deleteUserConnection(user_id, connection.connection).then(function(connection){
                    }, function(err){
                        console.log(err);
                    });
                    UserConnection.deleteUserConnection(connection.connection, user_id).then(function(connection){
                    }, function(err){
                        console.log(err);
                    });
                });
                resolve();
            }, function(err){
                reject(err);
            });
        });
    };


    db.sync(function(){
        cb();
    });
};
