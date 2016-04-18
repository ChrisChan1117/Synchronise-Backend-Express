var path      = require('path');
var mysql     = require(path.normalize(__dirname+"/drivers/mysql"));
var orm       = require(path.normalize(__dirname+"/orm"));
var Promise   = require('promise');
var securityH = require(path.normalize(__dirname + '/security'));

// Test if the credentials given are correct to access a database
// Input :
//  [String]masterType : sql/nosql
//  [Object]message : Contains the credentials of the database
//          |> name     : Name of the database
//          |> url      : url/ip to connect to the database
//          |> username : username of the database
//          |> password : password of the database
//          |> port     : port to connect to the database
//          |> type     : type (mysql, oracle, postgre, microsoft sql server, IBM DB2, IBM Informix, SAP Sybase Adaptive Server Enterprise ...)
//          |> limit    : How many concurrent connection Synchronise.IO is allowed to create
// Output :
//  [Promise]boolean
exports.getDriverForType = getDatabaseDriverForType;
function getDatabaseDriverForType(masterType, subtype){
    switch (masterType) {
        case "sql":
            switch (subtype) {
                case "mysql":
                    return mysql;
                    break;

                default:
                    return false;
            }
            break;
        default:
            return false;
    }
};

exports.testConnection = function(masterType, message){
    var driver = new getDatabaseDriverForType(masterType, message.type)();

    if(driver){
        return driver.testConnection(message);
    }else{
        return new Promise(function(resolve, reject){
            resolve(false);
        });
    }
};

/*
    Example :

    ["user":{
        id: {
            name       : "id",
            type       : "number",
            nativeType : "int(11) PRIMARY KEY"
        }
    }]
*/
exports.getDistantSchema = function(masterType, message){
    var driver = getDatabaseDriverForType(masterType, message.type);
    if(driver){
        var db = new driver(message);
        return db.distantSchema();
    }else{
        return new Promise(function(resolve, reject){
            resolve(false);
        });
    }
};

exports.getLocalSchema = function(idDatabase){
    var schema = {};
    return new Promise(function(resolve, reject){
        databaseTablesL(idDatabase).then(function(tables){
            var promiseTables = Array();

            _.each(tables, function(row){
                promiseTables.push(new Promise(function(resolve, reject){
                    tableSetFieldsL(row.id).then(function(fields){
                        schema[row.name] = {};

                        _.each(fields, function(field){
                            schema[row.name][field.name] = {
                                name       : field.name,
                                type       : field.type,
                                nativeType : field.nativeType,
                                id         : field.id
                            };
                        });

                        resolve();
                    });
                }));
            });

            Promise.all(promiseTables).then(function(){
                resolve(schema);
            });
        });
    });
};

/*
// Return the lists of Tables (for SQL) or Collections (for NoSQL) from the distant database
// Input :
//  [Object]database : Database object coming directly from the Synchronise.IO database
// Output:
//  [Promise]
//      [Array]success: list of tables/collections
exports.listOfTablesOrCollectionsFromDistant = function(database, user, password){
    var decryptedPublicKey   = securityH.decrypt(JSON.parse(user.public_key), password);
    var encryption_key       = decryptedPublicKey+user.private_key;

    var decryptedCredentials = securityH.decrypt(database.credentials, encryption_key);

    var driver = getDatabaseDriverForType(database.type, database.subtype);
        driver.connect({
            url      : dcrptdCrdntls.url,
            username : dcrptdCrdntls.username,
            password : dcrptdCrdntls.password,
            port     : dcrptdCrdntls.port,
            ssl      : false
        });


    return new Promise(function(resolve, reject){
        resolve();
        //driver.getStructure();
    });
}*/

// Return an object of database using its ID
function databaseObjectL(databaseId, response){
    return new Promise(function(resolve, reject){
        orm.model("Database").then(function(Database){
            Database.databaseWithID(databaseId).then(resolve, reject);
        });
    });
}
exports.databaseObject = databaseObjectL;

// Return all the tables of a database
function databaseTablesL(databaseId){
    return new Promise(function(resolve, reject){
        orm.model("DatabaseTableSet").then(function(DatabaseTableSet){
            DatabaseTableSet.tablesForDatabase(databaseId).then(resolve, reject);
        });
    });
};
exports.databaseTables = databaseTablesL;

// Returnes all the fields of a table
function tableSetFieldsL(tableSetId){
    return new Promise(function(resolve, reject){
        orm.model("DatabaseField").then(function(DatabaseField){
            DatabaseField.fieldsForTable(tableSetId).then(resolve, reject);
        });
    });
};
exports.tableSetFields = tableSetFieldsL;

// Return an object of table using its name and database ID
exports.tableObject = function(databaseId, tableName, response){
    var promise = new Parse.Promise();

    module.exports.databaseObject(databaseId, {
        success: function(database){
            var queryForTable = new Parse.Query('DatabaseTableSet');
                queryForTable.equalTo('database', database);
                queryForTable.equalTo('name', tableName);
                queryForTable.first({
                    success: function(tableObject){
                        if(tableObject){
                            if(typeof(response.success) != "undefined"){
                                response.success(tableObject);
                            }
                        }else{
                            if(typeof(response.error) != "undefined"){
                                response.error('Undefined table.');
                            }
                        }
                        promise.resolve();
                    },
                    error: function(){
                        if(typeof(response.error) != "undefined"){
                            response.error('An error occured while retrieving the table object.');
                        }
                        promise.resolve();
                    }
                });
        },
        error: function(error){
            if(typeof(response.error) != "undefined"){
                response.error(error);
            }
            promise.resolve();
        }
    });

    return promise;
}

// Return a DatabaseField object of table using its name and database ID
exports.tableFieldById = function(fieldId, response){
    var promise = new Parse.Promise();

    var queryForField = new Parse.Query('DatabaseField');
        queryForField.equalTo('objectId', fieldId);
        queryForField.first({
            success: function(field){
                if(field){
                    response.success(field);
                }else{
                    if(typeof(response.error) != "undefined"){
                        response.error("Undefined field");
                    }
                }
            },
            error: function(error){
                if(typeof(response.error) != "undefined"){
                    response.error(error);
                }
            }
        }).then(function(){
            promise.resolve();
        });

    return promise;
}

// Return a DatabaseField object of table using its name and database ID
exports.tableField = function(databaseId, tableName, fieldName, response){
    var promise = new Parse.Promise();

    module.exports.tableObject(databaseId, tableName, {
        success: function(table){
            var queryForField = new Parse.Query('DatabaseField');
                queryForField.equalTo('table', table);
                queryForField.equalTo('name', fieldName);
                queryForField.first({
                    success: function(field){
                        if(field){
                            response.success(field);
                        }else{
                            if(typeof(response.error) != "undefined"){
                                response.error("Undefined field for the table " + tableName);
                            }
                        }
                        promise.resolve();
                    },
                    error: function(error){
                        if(typeof(response.error) != "undefined"){
                            response.error(error);
                        }
                        promise.resolve();
                    }
                });
        },
        error: function(error){
            if(typeof(response.error) != "undefined"){
                response.error(error);
            }
            promise.resolve();
        }
    });

    return promise;
}

// Return the list of fields of a table
exports.tableFields = function(databaseId, tableName, response, tableObject){
    var promise = new Parse.Promise();
    var limit = 100;

    if(typeof(tableObject) != "undefined"){
        var numberFields = 0;
        var fields = Array();

        var queryForNumberFields = new Parse.Query('DatabaseField');
            queryForNumberFields.equalTo('table', tableObject);
            return queryForNumberFields.count({
                success: function(success){
                    numberFields = success;
                }
            }).then(function(){
                var promises = Array();
                for(var i = 0; i < Math.ceil(numberFields/limit); i++){
                    var promise2 = Parse.Promise.as();
                        promise2 = promise2.then(function(){
                            var queryForFields = new Parse.Query('DatabaseField');
                                queryForFields.equalTo('table', tableObject);
                                queryForFields.ascending('createdAt');
                                queryForFields.skip(i*limit);
                                return queryForFields.find({
                                    success: function(results){
                                        fields = fields.concat(results);
                                    }
                                });
                        });

                    promises.push(promise2);
                }
                return Parse.Promise.when(promises).then(function(){
                    if(typeof(response.success) != "undefined"){
                        response.success(fields);
                    }
                    promise.resolve();
                });
            });
    }else{
        module.exports.tableObject(databaseId, tableName, {
            success: function(tableObject){
                var numberFields = 0;
                var fields = Array();

                var queryForNumberFields = new Parse.Query('DatabaseField');
                    queryForNumberFields.equalTo('table', tableObject);
                    return queryForNumberFields.count({
                        success: function(success){
                            numberFields = success;
                        }
                    }).then(function(){
                        var promises = Array();
                        for(var i = 0; i < Math.ceil(numberFields/limit); i++){
                            var promise2 = Parse.Promise.as();
                                promise2 = promise2.then(function(){
                                    var queryForFields = new Parse.Query('DatabaseField');
                                        queryForFields.equalTo('table', tableObject);
                                        queryForFields.ascending('createdAt');
                                        queryForFields.skip(i*limit);
                                        return queryForFields.find({
                                            success: function(results){
                                                fields = fields.concat(results);
                                            }
                                        });
                                });

                            promises.push(promise2);
                        }
                        return Parse.Promise.when(promises).then(function(){
                            if(typeof(response.success) != "undefined"){
                                response.success(fields);
                            }
                            promise.resolve();
                        });
                    });
            },
            error: function(error){
                if(typeof(response.error) != "undefined"){
                    response.error(error);
                }
                promise.resolve();
            }
        });
    }

    return promise;
}
