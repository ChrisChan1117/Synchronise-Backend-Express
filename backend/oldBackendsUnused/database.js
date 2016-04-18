var path          = require('path');
var _             = require('underscore');
var Promise       = require('promise');
var securityH     = require(path.normalize(__dirname + '/../helpers/security'));
var userH         = require(path.normalize(__dirname + '/../helpers/user'));
var databaseH     = require(path.normalize(__dirname + '/../helpers/database'));
var urlBodyParser = require(path.normalize(__dirname + '/../helpers/urlBodyParser'));
var objFormatter  = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var orm           = require(path.normalize(__dirname + '/../helpers/orm'));
var socketio      = require(path.normalize(__dirname + '/../routes/socket-io'));

// Defines the default behavior of the ordering for a database page
var defaultSettingsForOrdering = {
    typeDatabase     : "all", // Default type database is all databases
    page             : 0, // Default page is 0
    orderType        : "modified_at", // Choose the ordering type. Default is date of last update
    orderByDirection : "desc", // Choose the ordering direction. Default is descending
    limit            : -1 // Choose the limit of databases to display. Default limit is -1 meaning no limit
};

// Return the list of datastore saved
exports.getListOfDatabase = function(request, response){
    var canContinue = true;
    var settingsForOrdering = {};

    orm.model(["User", "UserSettings", "Database"]).then(function(d){
        var user = d.User.current(request);

        new Promise(function(resolve, reject){
            d.UserSettings.get(["orderingForDatabasePage", defaultSettingsForOrdering], user).then(function(setting){
                settingsForOrdering = setting;
                resolve();
            }, function(err){
                canContinue = false;
                response.error(err);
                reject(err);
            });
        }).then(function(){
            if(canContinue){
                return new Promise(function(resolve, reject){
                    var totalDb = 0;
                    var dbs = Array();

                    d.Database.databasesForUser(user).then(function(databases){
                        totalDb = databases.length;
                        dbs = databases;

                        if(settingsForOrdering.page>0 && settingsForOrdering.limit != -1){
                            dbs = dbs.slice(settingsForOrdering.page*settingsForOrdering.limit, dbs.length); // SKIP
                        }

                        if(settingsForOrdering.limit != -1){
                            dbs = dbs.slice(0, settingsForOrdering.limit); // LIMIT
                        }

                        dbs = _.sortBy(dbs, function(row){ // ORDER BY
                            return row[settingsForOrdering.orderType];
                        });

                        if(settingsForOrdering.orderByDirection == "desc"){
                            dbs = dbs.reverse(); // DESCENDING
                        }

                        if(settingsForOrdering.typeDatabase != "all"){
                            dbs = _.filter(dbs, function(row){
                                return (row.subtype == setSettingsForOrdering.typeDatabase);
                            });
                        }

                        dbs = _.map(dbs, function(row){
                            return {
                                id: row.id
                            };
                        });
                    }).then(function(){
                        response.success({
                            count               : totalDb,
                            databases           : dbs,
                            pages               : Math.floor(totalDb/settingsForOrdering.limit),
                            currentPage         : settingsForOrdering.page,
                            settingsForOrdering : settingsForOrdering
                        });
                        resolve();
                    });
                });
            }
        });
    });
};

exports.getListOfDatabaseWithType = function(request, response){
    var type = request.params.type;

    orm.model(["User", "Database"]).then(function(d){
        var user = d.User.current(request);

        d.Database.databasesForUserWithType(user.id, type).then(function(databases){
            dbs = databases;
        }).then(function(){
            response.success({ databases: dbs });
            resolve();
        });
    });
};

exports.setSettingsForOrdering = function(request, response){
    orm.model(["UserSettings", "User"]).then(function(d){
        var user = d.User.current(request);

        d.UserSettings.get("orderingForDatabasePage", user).then(function(settings){
            var userSettings = {};

            if(settings){
                userSettings = settings;
            }else{
                userSettings = defaultSettingsForOrdering;
            }

            userSettings[request.params.key] = request.params.value;

            d.UserSettings.set("orderingForDatabasePage", userSettings, user).then(function(){
                response.success("Setting saved", 200, {}, user.id);
            }, function(err){
                response.error(err);
            });
        }, function(err){
            response.err(err);
        });
    });
};

exports.countDatabase = function(request, response){
    orm.model(["Database", "User"]).then(function(d){
        var user = d.User.current(request);

        d.Database.countDatabasesForUser(user).then(function(amount){
            response.success({ count: amount });
        }, function(err){
            response.error(err);
        });
    });
};

// Create or Update a datastore object
exports.addUpdateDatabaseCredentials = function(request, response){
    orm.model(["User", "Database", "DatabaseTableSet", "DatabaseField"]).then(function(d){
        var user       = d.User.current(request);

        var object     = request.params.objectId;
        var title      = request.params.title;
        var name       = request.params.name;
        var url        = request.params.url;
        var username   = request.params.username;
        var password   = request.params.password;
        var port       = request.params.port;
        var type       = request.params.type;
        var masterType = request.params.masterType;
        var limit      = request.params.limit;

        var credentials = {
            name     : name,
            url      : url,
            username : username,
            password : password,
            port     : port,
            type     : type,
            limit    : limit
        };

        // TO CREATE (testConnection)
        // Re-route the testConnection to the correct database driver
        databaseH.testConnection(masterType, credentials).then(function(success){
            var database = false;
            var canContinue = true;

            new Promise(function(resolve, reject){
                var fields = {
                    name        : name,
                    title       : title,
                    type        : masterType,
                    subtype     : type,
                    url         : url,
                    user_id     : user.id,
                    credentials : JSON.stringify(credentials) // Credentials
                };

                if(typeof(object) != "undefined"){
                    d.Database.databaseWithID(object).then(function(db){
                        db.save(fields, function(err){
                            if(err){
                                response.error(err);
                                canContinue = false;
                                reject(err);
                            }else{
                                resolve(db);
                            }
                        });
                    }, function(err){
                        response.error(err);
                        canContinue = false;
                        reject(err);
                    });
                }else{
                    d.Database.create(fields, function(err, db){
                        if(err){
                            response.error(err);
                            reject(err);
                            canContinue = false;
                        }else{
                            if(Array.isArray(db)){
                                resolve(objFormatter.format(db[0]));
                            }else{
                                resolve(objFormatter.format(db));
                            }
                        }
                    });
                }
            }).then(function(db){
                // Update the database schema
                if(canContinue){
                    return new Promise(function(resolve, reject){
                        // If the database schema has never been synced we can simply get it from the database
                        if(!db.firstUpdated){
                            db.updating = true;
                            db.save(function(err){
                                if(err){
                                    canContinue = false;
                                    reject(err);
                                }else{
                                    resolve(db);
                                }
                            });
                        }
                    });
                }
            }).then(function(db){
                if(canContinue){
                    databaseH.getDistantSchema(db.type, credentials).then(function(schema){
                        setTimeout(function(){
                            db.updating = false;
                            db.save();
                        }, 60000);

                        // Save the schema in the Synchronise database
                        var promisesTables = Array();

                        _.each(Object.keys(schema), function(tableName){
                            promisesTables.push(new Promise(function(resolveTable, rejectTable){
                                var fields = schema[tableName];

                                d.DatabaseTableSet.createTable(db.id, tableName).then(function(table){
                                    var promisesFields = Array();

                                    _.each(fields, function(field){
                                        promisesFields.push(new Promise(function(resolveField, rejectField){
                                            d.DatabaseField.createField(table.id, field.name, field.type, field.nativeType).then(function(field){
                                                resolveField("Field created");
                                            }, function(err){
                                                rejectField(err);
                                            });
                                        }));
                                    });

                                    Promise.all(promisesFields).then(function(){
                                        resolveTable("Table created");
                                    }, function(err){
                                        rejectTable(err);
                                    });
                                }, function(err){
                                    reject(err);
                                });
                            }));
                        });

                        Promise.all(promisesTables).then(function(){
                            // The database has now been updated
                            db.firstUpdated = true;
                            db.updating     = false;
                            db.save(function(err){
                                if(!err){
                                    response.success(db, 200, {id: db.id, type: masterType}, user.id);
                                }else{
                                    response.error(err);
                                    reject(err);
                                }
                            });
                        }, function(err){
                            response.error(err);
                            reject(err);
                        });
                    }, function(err){
                        response.error(err);
                        reject(err);
                    });
                }
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Remove a database credentials
exports.removeDatabase = function(request, response){
    securityH.askForPasswordConfirmation("Confirm deletion of the database", request, response).then(function(){
        orm.model(["User", "Database"]).then(function(d){
            var user       = d.User.current(request);
            var databaseId = request.params.databaseId;

            databaseH.databaseTables(databaseId).then(function(tables){
                var promiseForTables = [];
                _.each(tables, function(table){ // FOR EACH TABLES
                    promiseForTables.push(new Promise(function(resolve, reject){
                        var promisesLocal = [];
                        return databaseH.tableSetFields(table.id).then(function(fields){
                            _.each(fields, function(field){ // FOR EACH FIELDS OF THE CURRENT TABLE
                                promisesLocal.push(new Promise(function(resolveLocal, rejectLocal){
                                    field.remove(function(){
                                        resolveLocal();
                                    });
                                }));
                            });

                            return Promise.all(promisesLocal);
                        }).then(function(){
                            table.remove(function(){
                                resolve();
                            });
                        });
                    }));
                });

                Promise.all(promiseForTables).then(function(){
                    d.Database.databaseWithID(databaseId).then(function(db){
                        db.remove(function(){
                            var promisesForPing = Array();
                            Promise.all(promisesForPing).then(function(){
                                response.success('Database deleted', 200, {type: db.type}, [user.id]);
                            });
                        });
                    });
                });
            });
        });
    }, function(err){
        response.error(err);
    });
};

// Return a database object using its ID
exports.getDataStore = function(request, response){
    orm.model(["User", "Database"]).then(function(d){
        var user = d.User.current(request);

        d.Database.databaseWithID(request.params.id).then(function(databaseObject){
            if(user.id == databaseObject.user_id){
                response.success(databaseObject);
            }else{
                response.error("You are not allowed to view this Database");
            }
        }, response.error);
    });
};

exports.getTypeOfDatastores = function(request, response){
    response.success([
        {masterType: "sql",     title: "SQL",              iconName: "mysql",    id: 1},
        {masterType: "nosql",   title: "NOSQL",            iconName: "mongo",    id: 2},
        {masterType: "virtual", title: "Virtual Database", iconName: "database", id: 3}
    ]);
};

// Return the list of table Objects for a database stored on the Synchronise.IO server
exports.tableCollectionList = function(request, response){
    orm.model(["User", "Database"]).then(function(d){
        var user = d.User.current(request);

        var userIsAllowedToAccess = false;
        var databaseId = request.params.databaseId;

        d.Database.databaseWithID(databaseId).then(function(databaseObject){
            new Promise(function(resolve, reject){
                if(user.id == databaseObject.user_id){
                    userIsAllowedToAccess = true;
                    resolve();
                }else{
                    reject("You are not allowed to view the content of this database");
                }
            }).then(function(){
                databaseH.databaseTables(databaseId).then(function(tablesResult){
                    var tables = _.map(tablesResult, function(item){
                        return item.name;
                    });

                    response.success({tables : tables});

                }, response.error);
            }, function(err){
                response.error(err);
            });
        });
    });
};

// Return the list of table Objects for a database stored on the actual database of the customer (used for comparison of schema)
exports.tableCollectionListDistant = function(request, response){
    var canContinue = true;

    orm.model(["User"]).then(function(d){
        var user = d.User.current(request);
        var idDatabase;

        if(!request.params.databaseId){
            canContinue = false;
        }else{
            idDatabase = request.params.databaseId;
        }

        if(!request.params.password){
            canContinue = false;
        }else{
            var password = request.params.password;
        }

        if(canContinue){
            d.Database.databaseWithID(idDatabase).then(function(database){
                databaseH.listOfTablesOrCollectionsFromDistant(database, user, password);
            }, function(err){
                response.error(err);
            });
        }else{
            response.error("Undefined database");
        }
    });
};

exports.getDatabaseSchemaUpdates = function(request, response){
    orm.model(["User", "Database", "DatabaseTableSet", "DatabaseField"]).then(function(d){
        var user = d.User.current(request);

        var canContinue = true;
        var masterType;
        var database;
        var databaseCredentials;

        var databaseSchemaDistant;
        var databaseSchemaLocal;
        var updatedSchema = {};

        var updateAvailable = false; // Whether there was an updated schema or not
        var canUpdateAutomatically = false; // Whether the update could be computed automatically or not

        new Promise(function(resolve, reject){ // Collect the database information
            d.Database.databaseWithID(request.params.idDatabase).then(function(db){
                database = db;
                masterType = database.type;
                databaseCredentials = JSON.parse(database.credentials);
                database.updating = true;
                database.save(function(){
                    resolve();
                });
            }, function(err){
                reject(err);
                canContinue = false;
                response.error(err);
            });
        }).then(function(){ // Collect the schema of the database on the distant server (not Synchronise)
            if(canContinue){
                return new Promise(function(resolve, reject){
                    databaseH.getDistantSchema(masterType, databaseCredentials).then(function(schema){
                        databaseSchemaDistant = schema;
                        resolve();
                    }, function(err){
                        reject(err);
                        canContinue = false;
                        response.error(err);
                    });
                });
            }
        }).then(function(){ // Collect the scheme local (on Synchronise)
            if(canContinue){
                return new Promise(function(resolve, reject){
                    databaseH.getLocalSchema(database.id).then(function(schema){
                        databaseSchemaLocal = schema;
                        resolve();
                    }, function(err){
                        reject(err);
                        canContinue = false;
                        response.error(err);
                    });
                });
            }
        }).then(function(){ // Calculate the changes of the schema (local againt distant)
            if(canContinue){
                return new Promise(function(resolve, reject){
                    var tasks = Array();
                    var schema = {};

                    // Contains the names of the tables on the distant DB
                    // Example : ["user", "item", "orders", "anOldTable"]
                    var tableNamesDistant = Array();

                    // Contains the names of the tables on the local DB
                    // Example : ["user", "item", "orders", "aNewTable"]
                    var tableNamesLocal = Array();

                    // Contains the names of the fields in the tables on the distant DB
                    // Example : {
                    //   "user": ["id", "name", "email", "anOldField"],
                    //   "item": ["id", "title", "size"],
                    //   "orders": ["id", "quantity", "id_item", "id_user"],
                    //   "anOldTable": ["id", "aField", "anotherOne"]
                    // }
                    var fieldNamesDistant = {};

                    // Contains the names of the fields in the tables on the local DB
                    // Example : {
                    //   "user": ["id_name_modified", "name", "email", "aNewField"],
                    //   "item": ["id", "title", "size"],
                    //   "orders": ["id", "quantity", "id_item", "id_user"],
                    //   "anewTable" : ["id", "aField", "anotherNewField"]
                    // }
                    var fieldNamesLocal = {};

                    // Contains the list that are new in the schema = (distant-local)
                    // Example : ["anewTable"]
                    var newTablesName = Array();

                    // Contains the list that are new in the schema = (local-distant)
                    // Example : ["anOldTable"]
                    var removedTablesName = Array();

                    // Contains all of the tables names that are both in the local and the distant = (local ∩ distant)
                    // Example : ["user", "item", "orders"]
                    var unchangedTablesName = Array();

                    // Make a list of the names of tables in distant and also stores the fields of each in the object of fields
                    _.each(Object.keys(databaseSchemaDistant), function(key){
                        tableNamesDistant.push(key);

                        fieldNamesDistant[key] = Array();
                        // For each fields
                        _.each(Object.keys(databaseSchemaDistant[key]), function(keyField){
                            fieldNamesDistant[key].push(keyField);
                        });
                    });

                    // Make a list of the names of tables in local and also store the fields of each in the object of fields
                    _.each(Object.keys(databaseSchemaLocal), function(key){
                        tableNamesLocal.push(key);

                        fieldNamesLocal[key] = Array();
                        // For each fields
                        _.each(Object.keys(databaseSchemaLocal[key]), function(keyField){
                            fieldNamesLocal[key].push(keyField);
                        });
                    });

                    // Make a list of tables that seem to be new
                    _.each(tableNamesDistant, function(row){
                        if(tableNamesLocal.indexOf(row) == -1){
                            newTablesName.push(row);
                        }
                    });

                    // Make a list of tables that seem to be removed
                    _.each(tableNamesLocal, function(row){
                        if(tableNamesDistant.indexOf(row) == -1){
                            removedTablesName.push(row);
                        }
                    });

                    // Make a list of tables that have not changed
                    _.each(tableNamesLocal, function(row){
                        if(tableNamesDistant.indexOf(row) != -1){
                            unchangedTablesName.push(row);
                        }
                    });

                    var promisesTables = Array();

                    // If there is only new tables we can simply add them automatically
                    if(newTablesName.length && !removedTablesName.length){
                        canUpdateAutomatically = true;

                        _.each(newTablesName, function(table){
                            promisesTables.push(new Promise(function(resolve, reject){
                                d.DatabaseTableSet.createTable(request.params.idDatabase, table).then(function(tableObject){
                                    var fields = databaseSchemaDistant[table];
                                    var promiseFields = Array();

                                    _.each(fields, function(currentField){
                                        promiseFields.push(d.DatabaseField.createField(tableObject.id, currentField.name, currentField.type, currentField.nativeType));
                                    });

                                    Promise.all(promiseFields).then(function(){
                                        resolve();
                                    }, function(err){
                                        reject(err);
                                    });
                                }, function(err){
                                    reject(err);
                                });
                            }));
                        });
                    }

                    tasks.push(promisesTables);

                    var promisesRemoveTables = Array();
                    // If there is only removed tables we can simply remove them automatically
                    if(!newTablesName.length && removedTablesName.length){
                        canUpdateAutomatically = true;

                        _.each(removedTablesName, function(table){
                            promisesRemoveTables.push(new Promise(function(response, rej){
                                d.DatabaseTableSet.removeTable(table, request.params.idDatabase).then(response, rej);
                            }));
                        });
                    }

                    tasks.push(promisesRemoveTables);

                    // If there is both new and removed tables there might be a collision so we have to display the interface

                    // We now need to generate the schema that represents the current state of the syning

                    // We start with the new tables.
                    // Since they are new, all the fields are also new
                    _.each(newTablesName, function(row){
                        var fieldsDistant = fieldNamesDistant[row];

                        schema[row] = Array();
                        schema[row] = {
                            title  : row,
                            status : "add",
                            fields : _.map(fieldsDistant, function(field){
                                return {
                                    name: field,
                                    status: "add"
                                };
                            })
                        };
                    });

                    // We then do the same for the removed tables.
                    // Since they are removed, all the fields are also considered removed
                    _.each(removedTablesName, function(row){
                        var fieldsLocal = fieldNamesLocal[row];

                        schema[row] = Array();
                        schema[row] = {
                            title  : row,
                            status : "remove",
                            fields : _.map(fieldsLocal, function(field){
                                return {
                                    name: field,
                                    status: "remove"
                                };
                            })
                        };
                    });

                    // Now, here is the tricky part. The unchanged tables can have 3 types of fields : [normal|add|remove]
                    // For each field we have to figure it has not changed, in that case we ignore it,
                    // if it is new or removed, in that case we add it in the schema with the corresponding state
                    _.each(unchangedTablesName, function(row){
                        // We collect the names of the fields in the local schema
                        // Example for table 'user' : ["id", "name", "email", "anOldField"]
                        var fieldsLocal = fieldNamesLocal[row];

                        // We collect the names of the fields in the distant schema
                        // Example for table 'user' : ["id_name_modified", "name", "email", "aNewField"]
                        var fieldsDistant = fieldNamesDistant[row];

                        // Will contain the names of the fields that are new or seem to be new
                        var addedFields = Array();

                        // Will contain the names of the fields that have been removed or seem to be removed
                        var removedFields = Array();

                        // Find the field that have been added
                        _.each(fieldsDistant, function(field){
                            if(fieldsLocal.indexOf(field) == -1){
                                addedFields.push(field);
                            }
                        });

                        // Find the field that have been removed
                        _.each(fieldsLocal, function(field){
                            if(fieldsDistant.indexOf(field) == -1){
                                removedFields.push(field);
                            }
                        });

                        // We can now generate the schema with all of that

                        // Because we are not allowed to modify the structure of the Database, we have no tools to tell the changes.
                        // If a table is renamed, to Synchronise it looks like the old table has been removed and a new table has
                        // been created with the new name

                        // If there is no fields in a table there is no point in displaying it.
                        // Therefore, we do not process them at all

                        // Also :
                        // If there is only fields that have been REMOVED -> there is no need to display the interface,
                        //                                                  we can execute the code from the server and
                        //                                                  answer to the client that the work is complete
                        // Remove all of the fields
                        if(!addedFields.length && removedFields.length){
                            tasks.push(new Promise(function(resolveRemove, rejectRemove){
                                var promisesForFields = Array();

                                _.each(removedFields, function(field){
                                    promisesForFields.push(new Promise(function(response, rej){
                                        d.DatabaseTableSet.removeFieldWithNameWithTableNameWithDatabaseID(field, row, request.params.idDatabase).then(response, rej);
                                    }));
                                });

                                Promise.all(promisesForFields).then(function(){
                                    resolveRemove();
                                }, function(err){
                                    rejectRemove(err);
                                });
                            }));
                        }

                        // If there is ony fields that have been ADDED   -> there is no need to display the interface,
                        //                                                  we can execute the code from the server and
                        //                                                  answer to the client that the work is complete
                        // Create all of the fields
                        if(addedFields.length && !removedFields.length){
                            tasks.push(new Promise(function(resolveAddFields, rejectAddFields){
                                var promisesForFields = Array();

                                _.each(addedFields, function(field){
                                    promisesForFields.push(new Promise(function(resolve, reject){
                                        var fieldData = databaseSchemaDistant[row][field];
                                        d.DatabaseTableSet.createFieldWithTableNameWithDatabaseID(row, request.params.idDatabase, fieldData.name, fieldData.type, fieldData.nativeType).then(resolve, reject);
                                    }));
                                });

                                Promise.all(promisesForFields).then(resolveAddFields, rejectAddFields);
                            }));
                        }

                        // However, if there is both fields that are new and fields that are removed there might be a collision
                        // so we have to display the data we have to the dev for confirmation or further more info

                        if(addedFields.length && removedFields.length){
                            schema[row] = Array();
                            schema[row] = {
                                title: row,
                                status: "normal",
                                fields: _.map(addedFields, function(field){
                                    return {
                                        name: field,
                                        status: "add"
                                    };
                                })
                            };

                            schema[row].fields = schema[row].fields.concat(_.map(removedFields, function(field){
                                return {
                                    name: field,
                                    status: "remove"
                                };
                            }));
                        }
                    });

                    updatedSchema = schema;

                    Promise.all(tasks).then(resolve);
                });
            }
        }).then(function(){
            if(canContinue){
                return new Promise(function(resolve, reject){
                    database.updating = false;
                    database.save(function(){
                        resolve();
                    });
                });
            }
        }).then(function(){
            if(canContinue){
                var status = "";
                if(!updateAvailable){
                    status = "noUpdate";
                }else if (!canUpdateAutomatically) { // Update available and cannot be computed automatically
                    status = "needUserApproval";
                }else{
                    status = "autoUpdate";
                }

                response.success({
                    "status": status,
                    updatedSchema: updatedSchema
                }, 200, {id: database.id}, database.user_id);
            }
        });
    });
};

exports.getDataStoreSchema = function(request, response){
    var db_id = request.params.db_id;

    orm.model(["Database", "DatabaseTableSet", "DatabaseField"]).then(function(d){
        d.Database.databaseWithID(db_id).then(function(db){
            var g_tables = [];
            var g_fields = [];
            var tableFieldsList = [];
            var g_database = db;
            d.DatabaseTableSet.tablesForDatabase(db_id).then(function(tables){
                var promises_tables = [];
                _.each(tables, function(table){
                    promises_tables.push(new Promise(function(resolve_tables, reject){
                        var promises_fields = [];
                        promises_fields.push(new Promise(function(resolve_fields, reject){
                            g_tables.push(table);
                            d.DatabaseField.fieldsForTable(table.id).then(function(fields){
                                var promises_fields2 = [];
                                var field_names = [];
                                _.each(fields, function(field){
                                    promises_fields2.push(new Promise(function(resolve_fields2, reject){
                                        field_names.push({name: field.name, id: field.id});
                                        g_fields.push(field);
                                        resolve_fields2();
                                    }));

                                });
                                tableFieldsList.push({
                                    table: table.name,
                                    fields: field_names
                                });
                                return Promise.all(promises_fields2).then(resolve_fields, reject);
                            });
                        }));
                        Promise.all(promises_fields).then(resolve_tables, reject);
                    }));
                });
                return Promise.all(promises_tables).then(function(){

                    response.success({
                        database: g_database,
                        data: tableFieldsList
                    });
                });
            });
        }, function(err){
            reject(err);
        });
    });
};

exports.getExampleResult = function(request, response){
    var query_id = request.params.query_id;

    orm.model(["Database", "DatabaseTableSet", "DatabaseField"]).then(function(d){
        d.Database.databaseWithID(db_id).then(function(db){
            var g_tables = [];
            var g_fields = [];
            var tableFieldsList = [];
            var g_database = db;

            d.DatabaseTableSet.tablesForDatabase(db_id).then(function(tables){
                var promises_tables = [];
                _.each(tables, function(table){
                    promises_tables.push(new Promise(function(resolve_tables, reject){
                        var promises_fields = [];
                        promises_fields.push(new Promise(function(resolve_fields, reject){
                            g_tables.push(table);
                            d.DatabaseField.fieldsForTable(table.id).then(function(fields){
                                var promises_fields2 = [];
                                var field_names = [];
                                _.each(fields, function(field){
                                    promises_fields2.push(new Promise(function(resolve_fields2, reject){
                                        field_names.push(field.name);
                                        g_fields.push(field);
                                        resolve_fields2();
                                    }));

                                });
                                tableFieldsList.push({
                                    table: table.name,
                                    fields: field_names
                                });
                                return Promise.all(promises_fields2).then(resolve_fields, reject);
                            });
                        }));
                        Promise.all(promises_fields).then(resolve_tables, reject);
                    }));
                });

                return Promise.all(promises_tables).then(function(){
                    response.success({
                        database: g_database,
                        data: tableFieldsList
                    });
                });
            });
        }, reject);
    });
};
