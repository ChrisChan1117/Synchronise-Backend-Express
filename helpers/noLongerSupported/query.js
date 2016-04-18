var path      = require('path');
var userH     = require(path.normalize(__dirname + '/../helpers/user'));
var _         = require('underscore');
var databaseH = require('../helpers/database');

// Return an object of table using its name and database ID
exports.queryObject = function(queryId, response){
    var promise = new Parse.Promise();

    var queryForQuery = new Parse.Query('Query');
        queryForQuery.equalTo('objectId', queryId);
        queryForQuery.include(['datastore']);
        queryForQuery.first({
            success: function(object){
                if(typeof(response.success) != "undefined"){
                    response.success(object);
                    promise.resolve();
                }
            },
            error: function(error){
                if(typeof(response.error) != "undefined"){
                    response.error('An error occured while trying to retrieve the query');
                    promise.resolve();
                }
            }
        });

    return promise;
};

// Return a rule object using its ID
exports.queryRuleObject = function(ruleId, response){
    var promise = new Parse.Promise();

    var queryForRule = new Parse.Query('QueryRules');
        queryForRule.equalTo('objectId', ruleId);
        queryForRule.include('value');
        queryForRule.first({
            success: function(ruleObject){
                if(ruleObject){
                    if(typeof(response.success) != "undefined"){
                        response.success(ruleObject);
                        promise.resolve();
                    }
                }else{
                    if(typeof(response.error) != "undefined"){
                        response.error("Undefined query rule.");
                        promise.resolve();
                    }
                }
            },
            error: function(error){
                if(typeof(response.error) != "undefined"){
                    response.error(error);
                    promise.resolve();
                }
            }
        });

    return promise;
};

// Create a new Rule object
exports.createRule = function(params, response){
    var promise = new Parse.Promise();
    var paramsKeys = Object.keys(params);

    var newRule = new Parse.Object('QueryRules');

    userH.getUserObject(function(userObject){
        if(userObject){
            // SET ACL
            var userACL = new Parse.ACL(userObject);
                newRule.setACL(userACL);

            _.each(paramsKeys, function(currentKey){
                if(typeof(params[currentKey]) != "undefined"){
                    newRule.set(currentKey, params[currentKey]);
                }
            });

            newRule.save({
                success: function(newRuleObject){
                    if(typeof(response.success) != "undefined"){
                        response.success(newRuleObject);
                    }
                },
                error: function(){
                    if(typeof(response.error) != "undefined"){
                        response.error("An error occured while trying to create a new Rule");
                    }
                }
            }).then(function(){
                promise.resolve();
            });
        }else{
            if(typeof(response.error) != "undefined"){
                response.error("Undefiend user object. Please make sure your session did not expire.");
            }
            promise.resolve();
        }
    });

    return promise;
}

// Return a Rule Group object using its ID
exports.queryRuleGroupObject = function(idGroup, response){
    var promise = new Parse.Promise();

    var queryForGroup = new Parse.Query('QueryRulesGroup');
        queryForGroup.equalTo('objectId', idGroup);
        queryForGroup.first({
            success: function(groupObject){
                if(groupObject){
                    if(typeof(response.success) != "undefined"){
                        response.success(groupObject);
                    }
                }else{
                    if(typeof(response.error) != "undefined"){
                        response.error("An error occured while trying to retrieve the Rule Group Object");
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
    return promise;
}

// Create a new Rule Group and associate it to its query
exports.createQueryRuleGroup = function(query, response){
    var promise = new Parse.Promise();

    userH.getUserObject(function(userObject){
        if(userObject){
            var queryForNewGroup = new Parse.Object('QueryRulesGroup');
                queryForNewGroup.set('query', query);

            // SET ACL
            var userACL = new Parse.ACL(userObject);
            queryForNewGroup.setACL(userACL);

            queryForNewGroup.save({
                success: function(newObject){
                    if(typeof(response.success) != "undefined"){
                        response.success(newObject);
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
        }else{
            if(typeof(response.error) != "undefined"){
                response.error("Undefined user object. Please make sure your session did not expire.");
            }
            promise.resolve();
        }
    });

    return promise;
}

// Move a query rule to another Rule Group
// If the rule group does not have any rule anymore it will be removed
// If you do not know the current rule group just say undefined
exports.moveQueryToGroup = function(currentGroupId, newGroupId, rule, response){
    var promise = new Parse.Promise();
    var canContinue = true;
    var currentRuleGroupObject;
    var newRuleGroupObject;
    var ruleObject;

    var promise2 = new Parse.Promise.as();
        promise2 = promise2.then(function(){
            if(typeof(currentGroupId) != "undefined"){
                return module.exports.queryRuleGroupObject(currentGroupId, {
                    success: function(ruleGroup){
                        currentRuleGroupObject = ruleGroup;
                        currentRuleGroupObject.relation('rules').remove(rule);
                        return currentRuleGroupObject.save({
                            error: function(){
                                canContinue = false;
                                if(typeof(response.error) != "undefined"){
                                    response.error('An error occured while trying to remove the Rule from its current Rule Group.');
                                }
                            }
                        });
                    },
                    error: function(error){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error(error);
                        }
                    }
                }).then(function(){
                    if(canContinue){
                        // There is no rules in this group anymore. We should remove it!
                        if(currentRuleGroupObject.relation('rules').length == 0){
                            return currentRuleGroupObject.destroy({
                                error: function(error){
                                    canContinue = false;
                                    if(typeof(response.error) != "undefined"){
                                        response.error("An error occured while trying to remove the Rule Group " + currentRuleGroupObject.id + ". (This Rule Group no longer has Rules)");
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }).then(function(){
            if(canContinue){
                if(typeof(newGroupId) == "string"){
                    return module.exports.queryRuleGroupObject(newGroupId, {
                        success: function(newGroupToAssociate){
                            newRuleGroupObject = newGroupToAssociate;
                        },
                        error: function(error){
                            canContinue = false;
                            if(typeof(response.error) != "undefined"){
                                response.error(error);
                            }
                        }
                    });
                }else{
                    newRuleGroupObject = newGroupId;
                }
            }
        }).then(function(){
            if(canContinue){
                if(typeof(rule) == "string"){
                    return module.exports.queryRuleObject(rule, {
                        success: function(ruleFetched){
                            ruleObject = ruleFetched;
                        },
                        error: function(error){
                            canContinue = false;
                            response.error(error);
                        }
                    });
                }else{
                   if(typeof(rule) != "undefined"){
                       ruleObject = rule;
                   }else{
                       canContinue = false;
                       response.error('Undefined Rule Object');
                   }
                }
            }
        }).then(function(){
            if(canContinue){
                newRuleGroupObject.relation('rules').add(ruleObject);
                return newRuleGroupObject.save({
                    error: function(error){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("An error occured while trying to associate the Rule to its new Rule Group");
                        }
                    }
                });
            }
        }).then(function(){
            if(typeof(response.success)){
                response.success("Rule: " + ruleObject.id + " moved to new Rule Group: " + ruleObject.id);
            }
            promise.resolve();
        });

    return promise;
}

// Remove a Rule Object
exports.removeRule = function(ruleId, response){
    var promise = new Parse.Promise();

    module.exports.queryRuleObject(ruleId, {
        success: function(ruleObject){
            ruleObject.get('query').set('needsToBeCompiled', true);
            ruleObject.get('query').save().then(function(){
                if(typeof(ruleObject.get('value')) != "undefined"){
                    return ruleObject.get('value').destroy();
                }
            }).then(function(){
                ruleObject.destroy({
                    success: function(){
                        if(typeof(response.success) != "undefined"){
                            assets.pusher.trigger('query'+ruleObject.get('query').id, 'inqueue').then(function(){
                                response.success();
                                promise.resolve();
                            });
                        }else{
                            assets.pusher.trigger('query'+ruleObject.get('query').id, 'inqueue').then(function(){
                                promise.resolve();
                            });
                        }
                    },
                    error: function(error){
                        if(typeof(response.error) != "undefined"){
                            response.error(error);
                            promise.resolve();
                        }
                    }
                });
            });
        },
        error: function(error){
            if(typeof(response.error) != "undefined"){
                response.error(error);
                promise.resolve();
            }
        }
    });

    return promise;
}

// Return a QueryRuleValue object using its ID
exports.queryRuleValueObject = function(queryRuleValueId, response){
    var promise = new Parse.Promise();

    var queryForValue = new Parse.Query('QueryRulesValue');
        queryForValue.equalTo('objectId', queryRuleValueId);
        queryForValue.first({
            success: function(queryRuleValue){
                if(queryRuleValue){
                    if(typeof(response.success) != "undefined"){
                        response.success(queryRuleValue);
                    }
                }else{
                    if(typeof(response.error) != "undefined"){
                        response.error("Undefined QueryRuleValue object");
                    }
                }

                promise.resolve();
            },
            error: function(error){
                if(typeof(response.error) != "undefined"){
                    response.error("Undefined QueryRuleValue object");
                }
                promise.resolve();
            }
        });

    return promise;
}

// Create a QueryRuleValue Object
// The queryRule parameter can either be the id of the QueryRule or the QueryRule object itself
exports.createQueryRuleValue = function(queryRule, response){
    var queryRuleObject;
    var queryRuleValueObject;
    var canContinue = true;
    var ruleValueObject;

    var promise = new Parse.Promise();

    var promiseThen = Parse.Promise.as();
        promiseThen = promiseThen.then(function(){
            if(typeof(queryRule) == "string"){
                return module.exports.queryRuleObject(queryRule, {
                    success: function(objectFetched){
                        queryRuleObject = objectFetched;
                    },
                    error: function(error){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error(error);
                        }
                        promise.resolve();
                    }
                });
            }else{
                queryRuleObject = queryRule;
            }
        }).then(function(){
            if(canContinue){
                return userH.getUserObject(function(userObject){
                    if(userObject){
                        ruleValueObject = new Parse.Object('QueryRulesValue');

                        var userACL = new Parse.ACL(userObject);
                        ruleValueObject.setACL(userACL);

                        ruleValueObject.set('query', queryRuleObject.get('query'));
                    }else{
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("Undefined user. Please make sure your session did not expire.");
                        }
                        promise.resolve();
                    }
                });
            }
        }).then(function(){
            if(canContinue){
                return ruleValueObject.save({
                    success: function(newObjectCreated){
                        queryRuleValueObject = newObjectCreated;
                    },
                    error: function(error){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("An error occured while trying to save the RuleValue");
                        }
                        promise.resolve();
                    }
                });
            }
        }).then(function(){
            if(canContinue){
                queryRuleObject.set('value', queryRuleValueObject);
                return queryRuleObject.save({
                    success: function(){
                        if(typeof(response.success) != "undefined"){
                            response.success(queryRuleValueObject);
                            promise.resolve();
                        }
                    },
                    error: function(){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("An error occured while trying to associte the RuleValue to its Rule");
                        }
                        promise.resolve();
                    }
                });
            }
        });

    return promise;
}

exports.createUpdateQueryOrdering = function(params, response){
    var promise = new Parse.Promise();
    var idQuery = params.idQuery;
    var orderingObjectId = params.orderingObjectId;
    var orderingRule = params.orderingRule;
    var position = params.position;
    var field = params.field;

    var orderingObject;
    var canContinue = true;

    var promise2 = Parse.Promise.as();
        promise2 = promise2.then(function(){ // RETRIEVE THE ORDERING OBJECT
            if(typeof(orderingObjectId) != "undefined"){
                var queryForOrdering = new Parse.Query('QueryOrderingRule');
                    queryForOrdering.equalTo('objectId', orderingObjectId);
                    return queryForOrdering.first({
                        success: function(object){
                            orderingObject = object;
                        },
                        error: function(error){
                            canContinue = false;
                            if(typeof(response.error) != "undefined"){
                                response.error(error);
                            }
                            promise.resolve();
                        }
                    });
            }else{
                return userH.getUserObject(function(userObject){
                    if(userObject){
                        orderingObject = new Parse.Object('QueryOrderingRule');

                        var userACL = new Parse.ACL(userObject);
                        orderingObject.setACL(userACL);
                    }else{
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("Undefined user. Please make sure your session did not expire.");
                        }
                        promise.resolve();
                    }
                });
            }
        }).then(function(){
            if(canContinue){
                return orderingObject.save({
                    success: function(objectSaved){
                        orderingObject = objectSaved;
                    },
                    error: function(error){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("An error occured while creating the new Ordering");
                        }
                        promise.resolve();
                    }
                }).then(function(){
                    if(canContinue){
                        // Add the new OrderingObject to the QueryObject
                        var queryForDatabase = new Parse.Query('Query');
                            queryForDatabase.equalTo('objectId', idQuery);
                            return queryForDatabase.first({
                                success: function(queryObject){
                                    queryObject.relation('ordering').add(orderingObject);
                                    return queryObject.save({
                                        success: function(){
                                            queryObject.set('needsToBeCompiled', true);
                                            return queryObject.save();
                                        },
                                        error: function(error){
                                            canContinue = false;
                                            if(typeof(response.error) != "undefined"){
                                                response.error("An error occured while associating the Ordering rule to its Query Object");
                                            }
                                            promise.resolve();
                                        }
                                    }).then(function(){
                                        orderingObject.set('query', queryObject);
                                        return orderingObject.save().then(function(){
                                            return assets.pusher.trigger('query'+queryObject.id, 'inqueue');
                                        });
                                    });
                                }
                            });
                    }
                });
            }
        }).then(function(){
            if(canContinue){
                if(typeof(orderingRule) != "undefined"){
                    orderingObject.set('orderingAscDesc', orderingRule);
                }

                if(typeof(position) != "undefined"){
                    orderingObject.set('position', position);
                }

                if(typeof(field) != "undefined"){
                    if(typeof(field) == "string"){ // We have the ID of the DatabaseFieldObject
                        var fieldQuery = new Parse.Query('DatabaseField');
                            fieldQuery.equalTo('objectId', field);
                            fieldQuery.first({
                                success: function(fieldObject){
                                    orderingObject.set('field', fieldObject);
                                }
                            });
                    }else{ // We have a JSON object {datastore: datastoreId, table: tableName, field: fieldName}
                        if(typeof(field.datastore) != "undefined" &&
                           typeof(field.table) != "undefined" &&
                           typeof(field.field) != "undefined"){
                            var queryForDatabase = new Parse.Query('Database');
                                queryForDatabase.equalTo('objectId', field.datastore);

                            var queryForTable = new Parse.Query('DatabaseTableSet');
                                queryForTable.equalTo('name', field.table);
                                queryForTable.matchesQuery('database', queryForDatabase);

                            var queryField = new Parse.Query('DatabaseField');
                                queryField.equalTo('name', field.field);
                                queryField.matchesQuery('table', queryForTable);
                                return queryField.first({
                                    success: function(fieldObject){
                                        orderingObject.set('field', fieldObject);
                                    }
                                });
                        }
                    }
                }
            }
        }).then(function(){
            if(canContinue){
                return orderingObject.save({
                    success: function(newObjectSaved){
                        if(typeof(response.success) != "undefined"){
                            response.success(newObjectSaved);
                        }
                        promise.resolve();
                    },
                    error: function(){
                        canContinue = false;
                        if(typeof(response.error) != "undefined"){
                            response.error("An error occured while associating the Ordering rule to its Query Object");
                        }
                        promise.resolve();
                    }
                });
            }
        });

    return promise;
}

// Remove an OrderingRule object using its ID
exports.queryRemoveOrderingRule = function(orderingRule, response){
    var promise = new Parse.Promise();

    var queryForOrdering = new Parse.Query('QueryOrderingRule');
        queryForOrdering.equalTo('objectId', orderingRule);
        queryForOrdering.include('query');
        queryForOrdering.first({
            success: function(queryOrderingRule){
                if(queryOrderingRule){
                    queryOrderingRule.get('query').set('needsToBeCompiled', true);
                    queryOrderingRule.get('query').save().then(function(){
                        queryOrderingRule.destroy({
                            success: function(){
                                if(typeof(response.success) != "undefined"){
                                    assets.pusher.trigger('query'+queryOrderingRule.get('query').id, 'inqueue').then(function(){
                                        response.success("Ordering removed");
                                        promise.resolve();
                                    });
                                }else{
                                    assets.pusher.trigger('query'+queryOrderingRule.get('query').id, 'inqueue').then(function(){
                                        promise.resolve();
                                    });
                                }
                            },
                            error: function(){
                                if(typeof(response.error) != "undefined"){
                                    response.error("An error occured while trying to remove the OrderingRule");
                                }
                                promise.resolve();
                            }
                        });
                    });
                }else{
                    if(typeof(response.error) != "undefined"){
                        response.error("Undefined QueryOrderingRule object");
                    }
                    promise.resolve();
                }
            },
            error: function(error){
                if(typeof(response.error) != "undefined"){
                    response.error("Undefined QueryOrderingRule object");
                }
                promise.resolve();
            }
        });

    return promise;
}

exports.tryToChangeQueryIdentifier = function(params, response){
    var promise = new Parse.Promise();
    var string = params.identifier.replace(/ /g,'').replace(/\./g,'');
    userH.getUserObject(function(user){
        if(user){
            if(!string.length){
                if(typeof(response.error) != "undefined"){
                    response.error("You need to type at least one character.");
                }
                promise.resolve();
            }else{
                var queryObject = new Parse.Query('Query');
                queryObject.equalTo('uniqueIdentifier', string+user.id);
                    queryObject.first({
                        success: function(amount){
                            if(amount){
                                if(amount.id == params.queryId){
                                    if(typeof(response.success) != "undefined"){
                                        response.success(amount);
                                    }
                                }else{
                                    if(typeof(response.error) != "undefined"){
                                        response.error("This identifier is already set to another of your queries. You might want to try to put the project name in the identifier to make it different.");
                                    }
                                }
                                promise.resolve();
                            }else{
                                var queryObjectForQuery = new Parse.Query('Query');
                                queryObjectForQuery.equalTo('objectId', params.queryId);
                                queryObjectForQuery.first({
                                    success: function(queryObjectFetched){
                                        if(queryObjectFetched){
                                            queryObjectFetched.set('uniqueIdentifier', string+user.id);
                                            queryObjectFetched.save({
                                                success: function(newQueryObject){
                                                    if(typeof(response.success) != "undefined"){
                                                        response.success(newQueryObject);
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
                                        }else{
                                            if(typeof(response.error) != "undefined"){
                                                response.error("Undefined query. Please make sure this query is still available.");
                                            }
                                            promise.resolve();
                                        }
                                    },
                                    error: function(error){
                                        if(typeof(response.error) != "undefined"){
                                            response.error(error);
                                        }
                                        promise.resolve();
                                    }
                                });
                            }
                        },
                        error: function(error){
                            if(typeof(response.error) != "undefined"){
                                response.error(error);
                            }
                            promise.resolve();
                        }
                    });
            }
        }else{
            if(typeof(response.error) != "undefined"){
                response.error("Undefined user. Please make sure your session did not expire");
            }
            promise.resolve();
        }
    });

    return promise;
}

exports.ruleTextToExpression = function(text, database, value, target){
    switch(text){
        case 'equals':{
            switch(database){
                case 'mysql':
                    return target + " = " + value;
                    break;
            }
        }
            break;

        case 'doesNotEqual':{
            switch(database){
                case 'mysql':
                    return target + " != " + value;
                    break;
            }
        }
            break;

        case 'lessThan':{
            switch(database){
                case 'mysql':
                    return target + " < " + value;
                    break;
            }
        }
            break;

        case 'greaterThan':{
            switch(database){
                case 'mysql':
                    return target + " > " + value;
                    break;
            }
        }
            break;

        case 'lessThanOrEqualTo':{
            switch(database){
                case 'mysql':
                    return target + " =< " + value;
                    break;
            }
        }
            break;

        case 'greaterThanOrEqualTo':{
            switch(database){
                case 'mysql':
                    return target + " >= " + value;
                    break;
            }
        }
            break;

        case 'exists':{
            switch(database){
                case 'mysql':
                    return target + " IS NOT NULL";
                    break;
            }
        }
            break;

        case 'doesNotExist':{
            switch(database){
                case 'mysql':
                    return target + " IS NULL";
                    break;
            }
        }
            break;

        case 'startsWith':{
            switch(database){
                case 'mysql':
                    return target + " LIKE '" + value + "%'";
                    break;
            }
        }
            break;

        case 'true':{
            switch(database){
                case 'mysql':
                    return target + " = 1";
                    break;
            }
        }
            break;

        case 'false':{
            switch(database){
                case 'mysql':
                    return target + " = 0";
                    break;
            }
        }
            break;

        case 'before':{
            switch(database){
                case 'mysql':
                    return target + " < " + value;
                    break;
            }
        }
            break;

        case 'after':{
            switch(database){
                case 'mysql':
                    return target + " > " + value;
                    break;
            }
        }
            break;

        case 'beforeOrEqual':{
            switch(database){
                case 'mysql':
                    return target + " =< " + value;
                    break;
            }
        }
            break;

        case 'afterOrEqual':{
            switch(database){
                case 'mysql':
                    return target + " >= " + value;
                    break;
            }
        }
            break;
    }
}
