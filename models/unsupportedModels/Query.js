var path            = require("path");
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('query', {
        firstUpdated      : { type: "boolean", defaultValue: false },
        name              : { type: "text"                         },
        uniqueIdentifier  : { type: "text",    unique: true        },
        compiled          : { type: "text"                         },
        needsToBeCompiled : { type: "boolean", defaultValue: true  },
        type              : { type: "text"                         },
        project_id        : { type: "text"                         },
        db_type           : { type: "text"                         },
        db_id             : { type: "text"                         },
        corrupted         : { type: "boolean", defaultValue: false }
    }, {
        timestamp   : true,
        cache       : false,
        validations : {
            name             : orm.enforce.required("You need to provide a name for that query"),
            uniqueIdentifier : orm.enforce.required("Undefined unique indentifier"),
            type             : orm.enforce.required("Undefined type")
        },
        indexes : {
            firstUpdated      : redis.index.discrete,
            uniqueIdentifier  : redis.index.discrete,
            compiled          : redis.index.discrete,
            needsToBeCompiled : redis.index.discrete,
            type              : redis.index.discrete,
            project_id        : redis.index.discrete,
            db_type           : redis.index.discrete,
            db_id             : redis.index.discrete,
            corrupted         : redis.index.discrete
        }
    });

    global.Query = db.models.query;

    // Creates a new query object
    Query.createQuery = function(projectId, databaseId, type, databaseType){
        return new Promise(function(resolve, reject){
            Query.create({
                project_id : projectId,
                db_id      : databaseId,
                type       : type,
                db_type    : databaseType
            }, function(err, query){
                if(!err){
                    resolve(query);
                } else {
                    reject(err);
                }
            });
        });
    };

    // Returns the list of queries owned by a user
    Query.queriesForUser = function(user){
        return new Promise(function(resolve, reject){
          Query.find({ user_id: user.get('id') }, function(err, results){
            if(!err){
                resolve(objectFormatter.format(results));
            }else{
                reject(err);
            }
          });
        });
    };

    // Returns the list of Queries for a project
    Query.queriesForProject = function(project){
        return new Promise(function(resolve, reject){
            Query.find({ project_id: project }, function(err, results){
                if(!err){
                    resolve(objectFormatter.format(results));
                }else{
                    reject(err);
                }
            });
        });
    };

    // Return the amount of queries owned by a project
    Query.countQueriesForProject = function(project){
        return new Promise(function(resolve, reject) {
            var projectId;

            if(typeof(project) == "object"){
                projectId = project.id;
            }else{
                projectId = project;
            }

            Query.count({ project_id: projectId }, function(err, amount){
                if(!err){
                    resolve(amount);
                }else{
                    reject(err);
                }
            });
        });
    };

    // Return a query object
    Query.queryById = function(idGiven){
        return new Promise(function(resolve, reject){
          Query.one({id: idGiven}, function(err, query){
            if(!err){
                resolve(query);
            }else{
                reject(err);
            }
          });
        });
    };

    // This returns all of the queries that use the given id_field
    // Example return :
    // {
    //         QUERY_ID                    ID TASK                   TYPE OF TASK                      ID TASK               TYPE OF TASK
    //      "jnklzedljh": [{ id_task : "zjsdikwcnbelsd", type: "QueryDisplayedFields"}, { id_task : "sdmiluhkcds", type: "QueryOrderingRule"}]
    // }
    Query.queriesUsingField = function(id_field){
        var results = {};

        return new Promise(function(resolve, reject){
            var tasks = Array();

            tasks.push(new Promise(function(res, rej){
                ormLoader.model("QueryDisplayedFields").then(function(QueryDisplayedFields){
                    QueryDisplayedFields.usingField(id_field).then(function(objects){
                        _.each(objects, function(row){
                            if(!results.hasOwnProperty(row.query_id)){
                                results[row.query_id] = Array();
                            }

                            results[row.query_id].push({id_task: row.id, "type": "QueryDisplayedFields"});
                        });

                        res();
                    }, rej);
                }, rej);
            }));

            tasks.push(new Promise(function(res, rej){
                ormLoader.model("QueryOrderingRule").then(function(QueryOrderingRule){
                    QueryOrderingRule.usingField(id_field).then(function(objects){
                        _.each(objects, function(row){
                            if(!results.hasOwnProperty(row.id_query)){
                                results[row.query_id] = Array();
                            }

                            results[row.id_query].push({id_task: row.id, "type": "QueryOrderingRule"});
                        });

                        res();
                    }, rej);
                }, rej);
            }));

            Promise.all(tasks).then(function(){
                resolve(results);
            }, reject);
        });
    };

    // Set a query as corrupted
    Query.setAsCorrupted = function(id_query){
        return new Promise(function(resolve, reject){
            Query.one({id: id_query}, function(err, query){
                if(err){
                    reject(err);
                }else{
                    query.corrupted = true;
                    query.save(function(err){
                        if(err){ reject(err); }else{ resolve(); }
                    });
                }
            });
        });
    };

    // Returns the list of users that are allowed to see this query
    Query.usersAllowedToSeeQueryWithId = function(id_query){
        return new Promise(function(resolve, reject){
            Query.queryById(id_query).then(function(query){
                ormLoader.model("Project").then(function(Project){
                    Project.teamMembersForProject(query.project_id).then(function(users){
                        resolve(users);
                    }, reject);
                }, reject);
            }, reject);
        });
    };

    db.sync(function(){
        cb();
    });
};
