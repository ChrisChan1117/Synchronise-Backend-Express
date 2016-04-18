var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('role', {
        name        : { type: "text" }
    }, {
        timestamp   : true,
        validations : {
            name : orm.enforce.required("You need to provide a name for that Role")
        },
        indexes : {
            name : redis.index.discrete
        }
    });

    global.Role = db.models.role;

    ///// METHODS /////
    // Returns a list of role objects by their ID
    // - (array)IDs: array of roles IDs
    // - [return](array)of(objects)
    Role.rolesObjectsWithIDs = function(IDs){
        return new Promise(function(resolve, reject){
            var promises = Array();
            var results = Array();

            _.each(IDs, function(item){
                promises.push(new Promise(function(resolvethis, rejectthis){
                    Role.one({id: item}, function(err, roles){
                        if(err){
                            rejectthis(err);
                        }else{
                            results.push(roles);
                            resolvethis();
                        }
                    });
                }));
            });

            Promise.all(promises).then(function(){
                resolve(results);
            }, function(err){
                reject(err);
            });
        });
    };

    // Returns a role object using its name
    Role.roleWithName = function(name){
        return new Promise(function(resolve, reject) {
            Role.one({name: name}, function(err, result){
                if(err){ reject(err); }else if(!result){ reject("notFound"); }else{
                    resolve(result);
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
