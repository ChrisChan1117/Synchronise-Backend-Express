var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('componentinputprofile', {
        name: { type: "text" },
        id_component: { type: "text" },
        id_user: { type: "text" }
        data: { type: "text", defaultValue: "{data: []}" }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            name: redis.index.discrete,
            id_component: redis.index.discrete,
            id_user: redis.index.discrete
        }
    });

    global.ComponentInputProfile = db.models.componentinputprofile;

    // Returns the list of profiles a user create for a component
    ComponentInputProfile.profilesForComponentForUser = function(id_component, user){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);
            ComponentInputProfile.find({id_component: id_component, id_user: user_id}, function(err, profiles){
                if(err){ reject(err); }else{
                    resolve(_.map(profiles, function(row){
                        return _.extend(row, {data: JSON.parse(row.data).data})
                    }));
                }
            });
        });
    };

    // Creates a new profile for a user for a specific component
    ComponentInputProfile.createProfileForComponentForUser = function(id_component, user, data){
        return new Promise(function(resolve, reject) {
            var user_id = userH.userIdWithVar(user);
            ComponentInputProfile.create(data, function(err, newProfile){
                if(err){ reject(err); }else{ resolve(newProfile); }
            });
        });
    };

    // Return a profile using its ID
    ComponentInputProfile.profileById = function(id_profile){
        return new Promise(function(resolve, reject) {
            ComponentInputProfile.one({id: id_profile}, function(err, profile){
                if(err){ reject(err); }else{
                    if(profile){
                        profile.data = JSON.parse(profile.data).data;
                        resolve(profile)
                    }else{
                        resolve(false);
                    }
                }
            });
        });
    };

    // Updates a profile
    ComponentInputProfile.updateProfile = function(id_profile, data){
        return new Promise(function(resolve, reject) {
            ComponentInputProfile.profileById(id_profile).then(function(profile){
                if(profile){
                    if(typeof(data.data) == "object"){
                        data.data = JSON.stringify({"data": data.data});
                    }

                    profile.save(data, function(err, newProfile){
                        if(err){ reject(err); }else{ resolve(newProfile); }
                    });
                }else{
                    reject();
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
