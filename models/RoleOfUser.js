var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));
var _               = require('underscore');

module.exports = function (db, cb) {
    db.define('roleofuser', {
        id_user : { type: "text" },
        id_role : { type: "text" }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            id_user : redis.index.discrete,
            id_role : redis.index.discrete
        }
    });

    global.RoleOfUser = db.models.roleofuser;

    ///// METHODS /////
    RoleOfUser.rolesForUserId = function(id_user){
        return new Promise(function(resolve, reject){
            RoleOfUser.find({id_user: id_user}, function(err, roles){
                if(!err){
                    ormLoader.model("Role").then(function(Role){
                        var IDs = _.map(roles, function(item){ return item.id_role; console.log(JSON.stringify(item)); });
                        Role.rolesObjectsWithIDs(IDs).then(function(rolesObjects){
                            resolve(rolesObjects);
                        }, function(err){
                            reject(err);
                        });
                    });
                }else{
                    reject(err);
                }
            });
        });
    };

    // Return an array of users id that are associated to a role id
    RoleOfUser.usersIDForRole = function(id_role){
        return new Promise(function(resolve, reject){
            RoleOfUser.find({id_role: id_role}, function(err, results){
                if(err){ reject(err); }else{ resolve(_.map(results, function(row){
                    return row.id_user;
                }));}
            });
        });
    };

    // Remove the association of a role with a user
    // - (string)role_id: The ID of the role to dissociate
    // - (string|object): A user ID OR a user email OR a user object
    RoleOfUser.removeRoleForUser = function(role_id, user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);
            RoleOfUser.one({id_user: user_id, id_role: role_id}, function(err, object){
                if(err){ reject(err); }else{
                    if(object){
                        object.remove(function(){
                            resolve();
                        });
                    }else{
                        reject("Undefined Role association");
                    }
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
