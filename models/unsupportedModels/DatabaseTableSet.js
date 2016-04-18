var redis           = require('node-orm2-redis');
var path            = require('path');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var ormLoader       = require(path.normalize(__dirname + '/../helpers/orm'));

module.exports = function (db, cb) {
    db.define('databasetableset', {
        databaseId     : { type: "text" },
        name           : { type: "text" },
        usageFrequency : { type: "text" }
    }, {
        timestamp   : true,
        validations : {
            name : orm.enforce.required("You need to provide a name for that database table set")
        },
        indexes : {
            name           : redis.index.discrete,
            usageFrequency : redis.index.discrete,
            databaseId     : redis.index.discrete
        }
    });

    global.DatabaseTableSet = db.models.databasetableset;

    // Returns the list of tables saved in the schema on Synchronise for a specific database using its ID
    DatabaseTableSet.tablesForDatabase = function(databaseId){
        return new Promise(function(resolve, reject){
            DatabaseTableSet.find({databaseId: databaseId}, function(err, results){
                if(err){
                    reject(err);
                }else{
                    resolve(results);
                }
            });
        });
    };

    // Returns a table using its ID
    DatabaseTableSet.table_by_id = function(id){
        return new Promise(function(resolve, reject){
            DatabaseTableSet.one({id: id}, function(err, result){
                if(err){
                    reject(err);
                }else{
                    resolve(result);
                }
            });
        });
    };

    // Returns a table using its name and its database ID
    DatabaseTableSet.tableWithNameWithDatabaseID = function(table_name, id_database){
        return new Promise(function(resolve, reject){
            DatabaseTableSet.one({name: table_name, databaseId: id_database}, function(err, table){
                if(!err){ resolve(table); }else{ reject(err); }
            });
        });
    };

    // Create a new table in the schema saved on Synchronise
    DatabaseTableSet.createTable = function(databaseId, name){
        return new Promise(function(resolve, reject){
            DatabaseTableSet.one({databaseId: databaseId, name: name}, function(err, result){
                if(!err){
                    if(!result){
                        DatabaseTableSet.create({
                            databaseId : databaseId,
                            name       : name
                        }, function(err, table){
                            if(!err){
                                resolve(table);
                            }else{
                                reject(err);
                            }
                        });
                    }else{
                        reject("The table " + name + " already exists in that database");
                    }
                }else{
                    reject(err);
                }
            });
        });
    };

    // Removes a table from Synchronise database schema
    DatabaseTableSet.removeTable = function(table, id_database){
        var canContinue = true;

        return new Promise(function(resolve, reject){
            if(typeof(id_database) != "undefined"){
                DatabaseTableSet.one({databaseId: id_database, name: table}, function(err, table){
                    if(!err){
                        resolve(table);
                    }else{
                        reject(err);
                    }
                });
            }else{
                DatabaseTableSet.one({id: table}, function(err, table){
                    if(!err){
                        resolve(table);
                    }else{
                        reject(err);
                    }
                });
            }
        }).then(function(table){
            if(canContinue){
                return new Promise(function(resolve, reject){
                    var tasks = Array();

                    // Remove all fields of the table
                    tasks.push(new Promise(function(resolve, reject){
                        DatabaseField.fieldsForTable(table.id).then(function(fields){
                            var promisesFields = Array();

                            _.each(fields, function(field){
                                promisesFields.push(new Promise(function(resolveField, rejectField){
                                    field.remove(function(err){
                                        if(!err){
                                            var tasks2 = Array();

                                                tasks2.push(new Promise(function(res, rej){
                                                    // Set all queries that have used any of the fields as corrupt
                                                    ormLoader.model("Query").then(function(Query){
                                                        Query.queriesUsingField(field.id).then(function(results){
                                                            var internalTasks = Array();

                                                            _.each(Object.keys(results), function(query_id){
                                                                internalTasks.push(Query.setAsCorrupted(query_id));
                                                            });

                                                            Promise.all(internalTasks).then(res, rej);
                                                        });
                                                    });
                                                }));

                                            tasks2.push(new Promise(function(res, rej){
                                                // Create a new row in QueryCorruptedState
                                                ormLoader.model("QueryCorruptedState").then(function(QueryCorruptedState){
                                                    QueryCorruptedState.setCollisionsForField(field.id).then(function(){
                                                        res();
                                                    }, function(err){
                                                        rej(err);
                                                    });
                                                });
                                            }));

                                            Promise.all(tasks2).then(resolveField, rejectField);
                                        }else{
                                            reject(err);
                                        }
                                    });
                                }));
                            });

                            Promise.all(promisesFields).then(resolve, reject);
                        }, reject);
                    }));

                    // Remove the table
                    tasks.push(new Promise(function(resolve, reject){
                        table.remove(function(err){
                            if(!err){
                                resolve();
                            }else{
                                reject(err);
                            }
                        });
                    }));
                });
            }
        });
    };

    // Remove a field from the table using its ID
    DatabaseTableSet.removeFieldWithID = function(id_field){
        return new Promise(function(resolve, reject){
            var tasks = Array();

                tasks.push(new Promise(function(res, rej){
                    // Set all queries that have used any of the fields as corrupt
                    ormLoader.model("Query").then(function(Query){
                        Query.queriesUsingField(id_field).then(function(results){
                            var internalTasks = Array();

                            _.each(Object.keys(results), function(query_id){
                                internalTasks.push(Query.setAsCorrupted(query_id));
                            });

                            Promise.all(internalTasks).then(res, rej);
                        }, rej);
                    }, rej);
                }));


                tasks.push(new Promise(function(res, rej){
                    // Create a new row in QueryCorruptedState
                    ormLoader.model("QueryCorruptedState").then(function(QueryCorruptedState){
                        QueryCorruptedState.setCollisionsForField(id_field).then(res, rej);
                    }, rej);
                }));

                tasks.push(new Promise(function(res, rej){
                    ormLoader.model("DatabaseField").then(function(DatabaseField){
                        DatabaseField.removeWithID(id_field).then(res, rej);
                    });
                }));

            Promise.all(tasks).then(resolve, reject);
        });
    };

    // Remove a field from the table using only its name
    DatabaseTableSet.removeFieldWithNameWithTableID = function(name, id_table){
        return new Promise(function(resolve, reject){
            ormLoader.model("DatabaseField").then(function(DatabaseField){
                DatabaseField.fieldInTableWithName(id_table, name).then(function(field){
                    DatabaseTableSet.removeFieldWithID(field.id).then(resolve, reject);
                }, reject);
            });
        });
    };

    // Removes a field using its name, its table name, and its database ID
    DatabaseTableSet.removeFieldWithNameWithTableNameWithDatabaseID = function(name_field, name_table, id_database){
        return new Promise(function(resolve, reject){
            DatabaseTableSet.tableWithNameWithDatabaseID(name_table, id_database).then(function(table){
                DatabaseTableSet.removeFieldWithNameWithTableID(name_field, table.id).then(resolve, reject);
            }, reject);
        });
    };

    // Add a new field in the schema of a database stored on Synchronise
    DatabaseTableSet.createFieldWithTableNameWithDatabaseID = function(table_name, database_id, field_name, field_type, field_native_type){
        return new Promise(function(resolve, reject){
            DatabaseTableSet.tableWithNameWithDatabaseID(table_name, database_id).then(function(table){
                ormLoader.model("DatabaseField").then(function(DatabaseField){
                    DatabaseField.createField(table.id, field_name, field_type, field_native_type).then(resolve, reject);
                }, reject);
            }, reject);
        });
    };

    db.sync(function(){
        cb();
    });
};
