// The query backend is no longer supported. It is proide as an informational source code
var path            = require('path');
var _               = require('underscore');
var Promise         = require('promise');
var databaseH       = require(path.normalize(__dirname + '/../helpers/database'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));
var projectH        = require(path.normalize(__dirname + '/../helpers/project'));
var queryH          = require(path.normalize(__dirname + '/../helpers/query'));
var urlBodyParser   = require(path.normalize(__dirname + '/../helpers/urlBodyParser'));
var socketio        = require(path.normalize(__dirname + '/../routes/socket-io'));
var orm             = require(path.normalize(__dirname + '/../helpers/orm'));

// Returns the list of queries in a project
exports.getQueriesForProject = function(request, response){
    var id_project = request.params.id_project;

    orm.model(["Query", "User", "UserSettings"]).then(function(d){
        var user = d.User.current(request);

        d.UserSettings.get(["orderingQueriesForProject"+id_project, "orderingQueriesForProjects", {
            ordering: "modified_at",
            order   : "desc"
        }], user).then(function(ordering){
            if(ordering){
                d.Query.queriesForProject(id_project).then(function(queries){
                    var sorted = queries;

                    sorted = _.sortBy(sorted, function(query){
                        return query[ordering.ordering];
                    });

                    if(ordering.order == "desc"){
                        sorted.reverse();
                    }

                    response.success({
                        queries  : sorted,
                        ordering : ordering
                    });
                }, function(err){
                    response.error(err);
                });
            }
        });
    });
};

// Return the amount of queries the user has ted or is associated to
exports.countQueriesForUser = function(request, response){
    orm.model(["Query", "User", "Project"]).then(function(d){
        var user = d.User.current(request);

        d.Project.projectsForUser(user.id).then(function(projects){
            var promises = [];
            var total = 0;

            _.each(projects, function(row){
                promises.push(new Promise(function(resolve, reject){
                    d.Query.countQueriesForProject(row).then(function(amount){
                        total+=amount;
                        resolve();
                    }, reject);
                }));
            });

            Promise.all(promises).then(function(){
                response.success(total);
            }, function(err){
                response.error(err);
            });
        });
    });
};

// Change the ordering for the display of the list of queries of a project
exports.changeOrderingForQueriesInProject = function(request, response){
    var id_project = request.params.id_project;
    var ordering   = request.params.ordering;

    orm.model(["UserSettings", "User"]).then(function(d){
        var user = d.User.current(request);

        d.UserSettings.set("orderingQueriesForProject"+id_project, ordering, user).then(function(){
            response.success("", 200, {id_project : id_project}, user.id);
        }, response.error);
    });
};

// Return an object of a query
exports.getQuery = function(request, response){
    var id_query = request.params.id_query;

    orm.model("Query").then(function(Query){
        Query.queryById(id_query).then(function(query){
            response.success(query);
        }, function(err){
            response.error(err);
        });
    });
};

// Creates a new query for a project
exports.createQuery = function(request, response){
    var projectId    = request.params.id_project;
    var databaseId   = request.params.id_db;
    var type         = request.params.type;
    var databaseType = request.params.db_type;

    orm.model(["Query", "Project"]).then(function(d){
        d.Query.createQuery(projectId, databaseId, type, databaseType).then(function(query){
            d.Project.teamMembersForProject(query.project_id).then(function(members){
                response.success(query, 200, {id_project : query.project_id}, _.map(members, function(row){
                    return row.id;
                }));
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Changes the name of a query
exports.changeQueryName = function(request, response){
    var queryId = request.params.id_query;
    var name    = request.params.name;

    orm.model(["Query", "Project"]).then(function(d){
        d.Query.queryById(queryId).then(function(query){
            query.name = name;
            query.save(function(err){
                if(!err){
                    // Ping all of the people that are allowed to see or modify the query
                    d.Project.teamMembersForProject(query.project_id).then(function(members){
                        response.success(query, 200, {id_project: query.project_id}, _.map(members, function(row){
                            return row.id;
                        }));
                    });
                }else{
                    response.error('An error occured while changing the query name, please try again.');
                }
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Change the database onto which the query should be executed
exports.changeQueryDatastore = function(request, response){
    var queryId = request.params.id_query;
    var dbId = request.params.id_db;
    var dbType = request.params.db_type;

    orm.model(["Query", "QueryDisplayedFields", "QueryOrderingRule"]).then(function(d){
        d.Query.queryById(queryId).then(function(query){
            query.db_id = dbId;
            query.db_type = dbType;
            query.save(function(err){
                if(!err){
                    var promisesTasks = [];
                        promisesTasks.push(d.QueryDisplayedFields.removeAllDisplayedFieldsForQuery(queryId));
                        promisesTasks.push(d.QueryOrderingRule.removeAllOrderingRulesForQuery(queryId));

                    Promise.all(promisesTasks).then(function(){
                        // All of the users that are allowed to see this query should now see the schema list refresh
                        d.Query.usersAllowedToSeeQueryWithId(queryId).then(function(results){
                            var users = _.map(results, function(row){
                                return row.id;
                            });

                            response.success("", 200, {id_query: queryId, db_id: dbId}, users);
                        }, function(err){
                            response.error(err);
                        });
                    }, function(err){
                        response.error(err);
                    });
                }else{
                    response.error('An error occured while changing the query datastore, please try again.');
                }
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Delete a query
exports.deleteQuery = function(request, response){
    var queryId = request.params.id_query;

    orm.model(["Query", "Project"]).then(function(d){
        d.Query.queryById(queryId).then(function(query){
            var projectId = query.project_id;
            query.remove(function(err){
                if(!err){
                    d.Project.teamMembersForProject(projectId).then(function(members){
                        var users = _.map(members, function(row){
                            return row;
                        });

                        response.success(query, 200, {id_project: query.project_id}, users);
                    });
                    response.success();
                }else{
                    response.error('An error occured while deleting the query, please try again.');
                }
            });
        });
    });
};

// Returns the list of fields that have already been displayed for a query
exports.getSelectedFieldsForQuery = function(request, response){
    var queryId = request.params.id_query;

    orm.model(["QueryDisplayedFields", "DatabaseField", "DatabaseTableSet"]).then(function(d){
        d.QueryDisplayedFields.displayedFieldsForQuery(queryId).then(function(results, err){
            if(!err){
                var promises = [];
                var fields = [];
                _.each(results, function (f) {
                    promises.push(new Promise(function (resolve, reject) {
                        d.DatabaseField.field_with_id(f.field_id).then(function(field){
                            // Field does not exists anymore, probably the link has not been removed properly
                            if(!field){
                                // Get rid of the displayed field, no reason to keep it anymore
                                d.QueryDisplayedFields.removeDisplayedFieldForQuery(f.id).then(resolve, reject);
                            }else{ // The field still exists in the query
                                var promise_field = [];
                                    promise_field.push(new Promise(function (resolve_field, reject_field){
                                        d.DatabaseTableSet.table_by_id(field.tableSetId).then(function(table){
                                            var promise_field2 = [];
                                                promise_field2.push(new Promise(function (resolve_field2, reject_field2){
                                                    fields.push({
                                                        tableName        : table.name,
                                                        fieldName        : field.name,
                                                        type             : field.type,
                                                        displayedFieldId : field.id
                                                    });
                                                    resolve_field2();
                                                }));

                                            Promise.all(promise_field2).then(resolve_field, function(err){
                                                reject_field(err);
                                            });
                                        }, function(err){
                                            reject_field(err);
                                        });
                                    }));

                                Promise.all(promise_field).then(resolve, function(err){
                                    reject(err);
                                });
                            }
                        });
                    }));
                });
                return Promise.all(promises).then(function(){
                    response.success(fields);
                }, function(err){
                    response.error(err);
                });
            }else{
                response.error("There was a problem retrieving the selected fields for your query.");
            }
        });
    });
};

// Returns the list of fields from a database that have not been selected to be displayed in the query
exports.getUnselectedFieldsForQuery = function(request, response){
    var queryId = request.params.id_query;

    orm.model(["Query", "QueryDisplayedFields", "DatabaseField", "DatabaseTableSet", "Database"]).then(function(d){
        var tasksToDo = [];
        var fieldsDisplayed = [];
        var localSchema;

        // Get the query object
        d.Query.queryById(queryId).then(function(query){
            // Collect the list of fields that are already displayed
            tasksToDo.push(new Promise(function(resolve, reject){
                d.QueryDisplayedFields.displayedFieldsForQuery(queryId).then(function(fields){
                    var promiseForFields = [];
                    var tableObjects = {}; // Store the objects in memory to save some useless DB queries

                    // We now have the fields ID, but we need to collect their names
                    _.each(fields, function(row){
                        promiseForFields.push(new Promise(function(resolve2, reject2){
                            var tableObjectWeNeed;
                            var fieldObjectWeNeed;

                            // Collect the field object
                            d.DatabaseField.field_with_id(row.field_id).then(function(field){
                                fieldObjectWeNeed = field;

                                return new Promise(function(resolveTable, rejectTable){
                                    // Then collect the table object
                                    if(typeof(tableObjects[field.tableSetId]) != "undefined"){
                                        tableObjectWeNeed = tableObjects[field.tableSetId];
                                        resolveTable();
                                    }else{
                                        d.DatabaseTableSet.table_by_id(field.tableSetId).then(function(table){
                                            tableObjectWeNeed = table;
                                            tableObjects[field.tableSetId] = table;
                                            resolveTable();
                                        }, rejectTable);
                                    }
                                });
                            }).then(function(){
                                fieldsDisplayed.push({
                                    tableName        : tableObjectWeNeed.name,
                                    fieldName        : fieldObjectWeNeed.name,
                                    displayedFieldId : fieldObjectWeNeed.id
                                });
                                resolve2();
                            }, reject2);
                        }));
                    });

                    Promise.all(promiseForFields).then(resolve, reject);
                }, reject);
            }));

            // Collect the schema of the database
            tasksToDo.push(new Promise(function(resolve, reject){
                databaseH.getLocalSchema(query.db_id).then(function(schema){
                    localSchema = schema;
                    resolve();
                });
            }));

            // We now have all of the information we needed
            Promise.all(tasksToDo).then(function(){
                var results = [];

                _.each(fieldsDisplayed, function(row){
                    if(typeof(localSchema[row.tableName]) != "undefined"){
                        // Remove unwanted field
                        delete localSchema[row.tableName][row.fieldName];

                        // No fields left for this table
                        if(!Object.keys(localSchema[row.tableName]).length){
                            // Remove unwanted table
                            delete localSchema[row.tableName];
                        }
                    }
                });

                _.each(Object.keys(localSchema), function(table){
                    _.each(Object.keys(localSchema[table]), function(field){
                        results.push({
                            tableName        : table,
                            fieldName        : field,
                            displayedFieldId : localSchema[table][field].id
                        });
                    });
                });

                response.success(results);
            }, function(err){
                response.error(err);
            });
        });
    });
};

// Set a field to be displayed in the query
exports.selectFieldForQuery = function(request, response){
    var queryId = request.params.id_query;
    var fieldId = request.params.field_id;

    orm.model(["User", "QueryDisplayedFields", "Project", "Query"]).then(function(d){
        var user = d.User.current(request);

        d.QueryDisplayedFields.addDisplayedFieldForQuery(fieldId, queryId).then(function(err){
            if(!err){
                d.Query.queryById(queryId).then(function(query){
                    d.Project.teamMembersForProject(query.project_id).then(function(users){
                        var usersId = _.map(users, function(row){
                            return row.id;
                        });

                        response.success("", 200, {id_query: queryId}, usersID);
                    });
                });
            }else{
                response.error("There was a problem retrieving the selected fields for your query.");
            }
        });
    });
};

// Unset a field to be displayed in the query
exports.unSelectFieldForQuery = function(request, response){
    var idField = request.params.id;
    var queryId = request.params.id_query;

    orm.model(["User", "QueryDisplayedFields", "Project", "Query"]).then(function(d){
        var user = d.User.current(request);

        d.QueryDisplayedFields.removeDisplayedFieldWithIdForQuery(idField).then(function (err) {
            if(!err){
                d.Query.queryById(queryId).then(function(query){
                    d.Project.teamMembersForProject(query.project_id).then(function(users){
                        var usersID = _.map(users, function(row){
                            return row.id;
                        });

                        response.success("", 200, {id_query: queryId}, usersID);
                    });

                }, function(err){
                    response.error(err);
                });
            }else{
                response.error("There was a problem retrieving the selected fields for your query.");
            }
        });
    });
};

// Returns the list of ordering rules
exports.orderingRules = function(request, response){
    var queryId = request.params.id_query;
    var canContinue = true;
    var orderingRules = [];
    var results = [];

    orm.model(["User", "QueryOrderingRule", "DatabaseField", "DatabaseTableSet"]).then(function(d){
        var user = d.User.current(request);

        new Promise(function(resolve, reject){
            d.QueryOrderingRule.rulesForQuery(queryId).then(function(rules){
                orderingRules = rules;
                resolve();
            }, function(err){
                canContinue = false;
                reject(err);
            });
        }).then(function(){
            if(canContinue){
                var promisesFields = [];

                _.each(orderingRules, function(rule){
                    promisesFields.push(new Promise(function(resolveField, rejectField){
                        var g_field;
                        var g_table;

                        new Promise(function(resolveDBField, rejectDBField){
                            d.DatabaseField.field_with_id(rule.id_field).then(function(field){
                                g_field = field;
                                resolveDBField();
                            }, function(err){
                                canContinue = false;
                                rejectDBField(err);
                            });
                        }).then(function(){
                            if(canContinue){
                                return new Promise(function(resolveTable, rejectTable){
                                    d.DatabaseTableSet.table_by_id(g_field.tableSetId).then(function(table){
                                        g_table = table;
                                        resolveTable();
                                    }, function(err){
                                        canContinue = false;
                                        rejectTable(err);
                                    });
                                });
                            }
                        }, function(err){
                            rejectField(err);
                        }).then(function(){
                            if(canContinue){
                                results.push({
                                    type      : g_field.type,
                                    tableName : g_table.name,
                                    fieldName : g_field.name,
                                    id        : rule.id,
                                    ordering  : rule.orderingAscDesc,
                                    position  : rule.position
                                });
                                resolveField();
                            }
                        });
                    }));
                });

                Promise.all(promisesFields).then(function(){
                    response.success(results);
                }, function(err){
                    response.error(err);
                });
            }
        }, function(err){
            response.error(err);
        });
    });
};

// Returns the list of fields that are available to add as ordering for a query
// In other words : all of the fields that have been displayed but are not yet in ordering rules
exports.fieldsAvailableForOrderingInQuery = function(request, response){
    var results = [];
    var id_query = request.params.id_query;

    orm.model(["User", "QueryDisplayedFields", "QueryOrderingRule", "DatabaseField", "DatabaseTableSet"]).then(function(d){
        var user            = d.User.current(request);

        var promisesData    = [];
        var displayedFields = [];
        var orderingRules   = [];

        promisesData.push(d.QueryDisplayedFields.displayedFieldsForQuery(id_query).then(function(data){
            displayedFields = data;
        }));

        promisesData.push(d.QueryOrderingRule.rulesForQuery(id_query).then(function(rules){
            orderingRules = _.map(rules, function(row){
                return row.id_field;
            });
        }));

        Promise.all(promisesData).then(function(){
            var promisesFields = [];

            _.each(displayedFields, function(row){
                promisesFields.push(new Promise(function(resolve, reject) {
                    if(orderingRules.indexOf(row.field_id) == -1){
                        // The displayed fields is not in the list of ordering list already
                        d.DatabaseField.field_with_id(row.field_id).then(function(fieldObject){
                            d.DatabaseTableSet.table_by_id(fieldObject.tableSetId).then(function(tableObject){
                                results.push({
                                    type             : fieldObject.type,
                                    tableName        : tableObject.name,
                                    displayedFieldId : fieldObject.id,
                                    fieldName        : fieldObject.name
                                });
                                resolve();
                            }, reject);
                        }, reject);
                    }else{
                        resolve();
                    }
                }));
            });

            Promise.all(promisesFields).then(function(){
                response.success(results);
            }, function(err){
                response.error(err);
            });
        });
    });
};

// Creates a new Query Ordering Rule
// Params :
// - id_field : Id of the field in database
// - id_query : Id of the query to associate it to
exports.createOrderingRule = function(request, response){
    var canContinue = true;

    orm.model(["QueryOrderingRule", "DatabaseField", "Project", "Query"]).then(function(d){
        d.DatabaseField.field_with_id(request.params.id_field).then(function(result){
            if(!result){
                canContinue = false;
                response.error("An error occured while trying to retrive the database table-field");
            }
        }, function(err){
            canContinue = false;
            response.error(err);
        }).then(function(){
            if(canContinue){
                d.QueryOrderingRule.createRule(request.params.id_field, request.params.id_query).then(function(orderingRule){
                    d.Query.queryById(request.params.id_query).then(function(query){
                        d.Project.teamMembersForProject(query.project_id).then(function(usersFound){
                            var users = _.map(usersFound, function(row){
                                return row.id;
                            });

                                response.success("", 200, {id_query: request.params.id_query}, users);
                        }, function(err){
                            response.error(err);
                        });
                    }, function(err){
                        response.error(err);
                    });
                }, function(err){
                    response.error(err);
                });
            }
        });
    });
};

exports.removeOrderingRule = function(request, response){
    var canContinue = true;

    orm.model(["QueryOrderingRule", "Project", "Query"]).then(function(d){
        d.QueryOrderingRule.removeRule(request.params.id_rule).then(function(orderingRule){
            d.Query.queryById(request.params.id_query).then(function(query){
                d.Project.teamMembersForProject(query.project_id).then(function(usersFound){
                    var users = _.map(usersFound, function(row){
                        return row.id;
                    });

                    response.success("", 200, {id_query: request.params.id_query}, users);
                }, function(err){
                    response.error(err);
                });
            }, function(err){
                response.error(err);
            });
        }, function(err){
            response.error(err);
        });
    });
};

// Returns the list of fields that are displayed on the query (SELECT statement)
// Params :
// - query_id :
exports.displayedFields = function(request, response){
    var canContinue = true;

    orm.model("QueryDisplayedFields").then(function(QueryFieldDisplayed){
        QueryFieldDisplayed.displayedFieldsForQuery(request.params.query_id).then(function(fields){
            response.success(fields);
        }, function(err){
            canContinue = false;
            response.error(err);
        });
    });
};
