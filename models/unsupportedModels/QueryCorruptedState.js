var path            = require("path");
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('querycorruptedstate', {
        id_field  : { type: "text" },
        id_query  : { type: "text" },
        resolved  : { type: "boolean", defaultValue: false },
        id_reason : { type: "text" },
        type_task : { type: "text" },
        id_task   : { type: "text" }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            id_field  : redis.index.discrete,
            id_query  : redis.index.discrete,
            id_task   : redis.index.discrete,
            id_reason : redis.index.discrete,
            type_task : redis.index.discrete,
            resolved  : redis.index.discrete
        }
    });

    global.QueryCorruptedState = db.models.querycorruptedstate;

    // Returns all of the collisions there is in a query because of missing fields or other issues
    QueryCorruptedState.unresolvedStatesForQuery = function(id_query){
        return new Promise(function(resolve, reject){
            QueryCorruptedState.find({resolve: false, id_query: id_query}, function(err, results){
                if(!err){
                    resolve(results);
                }else{
                    reject(err);
                }
            });
        });
    };

    // Creates all of the collisions states for a field
    // I.E the given field is not available anymore
    QueryCorruptedState.setCollisionsForField = function(id_field){
        return new Promise(function(resolve, reject){
            ormLoader.model("Query").then(function(Query){
                Query.queriesUsingField(id_field).then(function(results){
                    var tasks = Array();

                    _.each(Object.keys(results), function(row){
                        var currentQueryID = row;
                        var currentQueryData = results[currentQueryID];

                        _.each(currentQueryData, function(match){
                            tasks.push(new Promise(function(res, rej){
                                QueryCorruptedState.create({
                                    id_field  : id_field,
                                    id_query  : currentQueryID,
                                    id_reason : 1, // Only one reason at the moment so by default we select the first reason
                                    type_task : match.type,
                                    id_task   : match.id_task
                                }, function(err){
                                    if(err){ rej(err); }else{ res(); }
                                });
                            }));
                        });
                    });

                    Promise.all(tasks).then(resolve, reject);
                });
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
