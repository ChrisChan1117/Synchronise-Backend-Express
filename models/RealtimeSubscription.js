var path            = require('path');
var redis           = require('node-orm2-redis');
var promise         = require('promise');
var underscore      = require('underscore');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));

module.exports = function (db, cb) {
    db.define('realtimesubscription', {
        room               : { type: "text" },
        // Serialised object :
        // [{
        //      name       : "targetName" This is the name of the function that will be executed when event trigger
        //      parameters : [{
        //          name  : "nameOfTheParameter",
        //          value : "valueToUseForParameter"  (optional) If not provided, will try to find a value
        //                                                       in the list of parameters provided during execution
        //      }]
        // }]
        subscriptions      : { type: "text" }
    }, {
        timestamp   : true,
        indexes     : {
            room          : redis.index.discrete,
            subscriptions : redis.index.discrete
        }
    });

    global.RealtimeSubscription = db.models.realtimesubscription;

    RealtimeSubscription.countSubscription = function(){
        return new Promise(function(resolve, reject) {
            RealtimeSubscription.count({}, function(err, amount){
                resolve(amount)
            });
        });
    };

    // Check if the default subscriptions are set
    RealtimeSubscription.countSubscription().then(function(amount){
        if(!amount){ // No default subscription
            var defaultRealtimeSubs = '{"data":[{"room":"setDefaultCard","subscriptions":[{"name":"getCardsListForUser","parameters":[]}]},{"room":"deleteCard","subscriptions":[{"name":"getCardsListForUser","parameters":[]}]},{"room":"saveCardInfo","subscriptions":[{"name":"getCardsListForUser","parameters":[]},{"name":"unreadNotification","parameters":[]}]},{"room":"setSettingsForOrderingDatabase","subscriptions":[{"name":"getListOfDatabase","parameters":[]}]},{"room":"addUpdateDatabaseCredentials","subscriptions":[{"name":"databaseObject","parameters":[{"name":"id"}]},{"name":"getListOfDatabase","parameters":[]},{"name":"countDatabase","parameters":[]},{"name":"getListOfDatabaseWithType","parameters":[{"name":"type"}]}]},{"room":"superadminSubscribeFunctionToRealTime","subscriptions":[{"name":"listOfRealtimeSubscriptions","parameters":[]}]},{"room":"getDatabaseSchemaUpdates","subscriptions":[{"name":"databaseObject","parameters":[{"name":"id"}]}]},{"room":"createComponent","subscriptions":[{"name":"countComponent","parameters":[]},{"name":"listOfComponents","parameters":[]}]},{"room":"updateComponent","subscriptions":[{"name":"loadComponent","parameters":[{"name":"id"}]}]},{"room":"removeComponent","subscriptions":[{"name":"countComponent","parameters":[]},{"name":"listOfComponents","parameters":[]},{"name":"loadComponent","parameters":[{"name":"id"}]}]},{"room":"addSectionDocumentation","subscriptions":[{"name":"getDocumentationSection","parameters":[{"name":"id"}]},{"name":"getDocumentationTree","parameters":[]}]},{"room":"updateDocumentationSection","subscriptions":[{"name":"getDocumentationSection","parameters":[{"name":"id"}]},{"name":"getDocumentationTree","parameters":[]}]},{"room":"removeWorkflow","subscriptions":[{"name":"listOfWorkflows","parameters":[]},{"name":"getWorkflow","parameters":[{"name":"id"}]},{"name":"countWorkflow","parameters":[]}]},{"room":"pickPlanForUser","subscriptions":[{"name":"userObject","parameters":[{"name":"id"}]}]},{"room":"addSectionMarketPlace","subscriptions":[{"name":"getSectionsMarketPlace","parameters":[]}]},{"room":"removeSectionMarketPlace","subscriptions":[{"name":"getSectionsMarketPlace","parameters":[]}]},{"room":"removeDatabase","subscriptions":[{"name":"getListOfDatabase","parameters":[]},{"name":"countDatabase","parameters":[]},{"name":"getListOfDatabaseWithType","parameters":[{"name":"type"}]}]},{"room":"addUpdateProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]}]},{"room":"removeProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]}]},{"room":"addMemberToProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]},{"name":"teamMembersForProject","parameters":[]}]},{"room":"removeTeamMemberFromProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]},{"name":"teamMembersForProject","parameters":[{"name":"id_project"}]}]},{"room":"leaveProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]},{"name":"teamMembersForProject","parameters":[{"name":"id_project"}]}]},{"room":"changeMemberPermissionsForProject","subscriptions":[{"name":"teamMembersForProject","parameters":[{"name":"id_project"}]},{"name":"projectList","parameters":[]}]},{"room":"changeOrderingForQueriesInProject","subscriptions":[{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}]},{"room":"createQuery","subscriptions":[{"name":"countQueriesForUser","parameters":[]},{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}]},{"room":"changeQueryName","subscriptions":[{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}]},{"room":"changeQueryDatastore","subscriptions":[{"name":"getDataStoreSchema","parameters":[{"name":"db_id"}]},{"name":"getSelectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"getUnselectedFieldsForQuery","parameters":[{"name":"id_query"}]}]},{"room":"deleteQuery","subscriptions":[{"name":"countQueriesForUser","parameters":[]},{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}]},{"room":"selectFieldForQuery","subscriptions":[{"name":"getSelectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"getUnselectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"orderingRules","parameters":[{"name":"id_query"}]},{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}]},{"room":"unSelectFieldForQuery","subscriptions":[{"name":"getSelectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"getUnselectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"orderingRules","parameters":[{"name":"id_query"}]},{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}]},{"room":"createOrderingRule","subscriptions":[{"name":"orderingRules","parameters":[{"name":"id_query"}]},{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}]},{"room":"removeOrderingRule","subscriptions":[{"name":"orderingRules","parameters":[{"name":"id_query"}]},{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}]},{"room":"removeRowFromModel","subscriptions":[{"name":"superadminContentOfModel","parameters":[{"name":"model"}]},{"name":"superadminModelCount","parameters":[{"name":"model"}]}]},{"room":"login","subscriptions":[{"name":"getCurrentSession","parameters":[]}]},{"room":"userSettingSet","subscriptions":[{"name":"userSetting","parameters":[{"name":"key"}]}]},{"room":"createOrUpdateProject","subscriptions":[{"name":"getProject","parameters":[{"name":"id_project"}]}]},{"room":"removeSectionDocumentation","subscriptions":[{"name":"getDocumentationTree","parameters":[]},{"name":"getDocumentationSection","parameters":[{"name":"id"}]}]},{"room":"removeSectionDocumentation","subscriptions":[]},{"room":"cancelSubscription","subscriptions":[{"name":"userObject","parameters":[]}]},{"room":"changePlan","subscriptions":[{"name":"userObject","parameters":[]}]},{"room":"superadminApproveComponent","subscriptions":[{"name":"superadminLoadMarketplaceValidationData","parameters":[]}]},{"room":"superadminRemoveRowFromModel","subscriptions":[{"name":"superadminContentOfModel","parameters":[{"name":"model"}]}]},{"room":"updateWorkflow","subscriptions":[{"name":"getWorkflow","parameters":[{"name":"id"}]}]},{"room":"createWorkflow","subscriptions":[{"name":"countWorkflow","parameters":[]}]},{"room":"createWorkflow","subscriptions":[]}]}';
            var data = JSON.parse(defaultRealtimeSubs).data;

            for (var i = 0; i < data.length; i++) {
                var row = data[i];

                RealtimeSubscription.createSubscription(row.room).then(function(){
                    for (var j = 0; j < array.length; j++) {
                        var row2 = array[j];
                        RealtimeSubscription.subscribeElementToRoom({
                            name       : row2.name,
                            parameters : row2.parameters
                        }, row.room);
                    }
                });
            }
        }
    });

    RealtimeSubscription.createSubscription = function(room){
        return new Promise(function(resolve, reject) {
            RealtimeSubscription.one({room: room}, function(err, object){
                if(err){
                    reject(err);
                }else{
                    if(!object){
                        RealtimeSubscription.create({
                            room          : room,
                            subscriptions : JSON.stringify({data: []})
                        }, function(err, objectCreated){
                            if(!err){ resolve(objectCreated); }else{ reject(err); }
                        });
                    }else{ resolve(object); }
                }
            });
        });
    };

    // Params :
    // - [string]room : the room that will trigger the event (where we are triggering from)
    RealtimeSubscription.subscriptionsForRoom = function(room){
        return new Promise(function(resolve, reject) {
            RealtimeSubscription.one({room: room}, function(err, object){
                if(err){
                    reject(err);
                }else{
                    if(object){
                        // De-serialise the object
                        var subscriptions      = JSON.parse(object.subscriptions).data;
                        object.subscriptions   = subscriptions;

                        resolve(object);
                    }else{ resolve(false); }
                }
            });
        });
    };

    // Params :
    // - [object]element : The element to subscribe to the room
    // - [string]room    : The room to subscribe the element to
    //
    // [error]: "The room you are trying to subscribe the element to, does not exists"
    RealtimeSubscription.subscribeElementToRoom = function(element, room){
        return new Promise(function(resolve, reject) {
            RealtimeSubscription.subscriptionsForRoom(room).then(function(object){
                if(object){
                    var IDSofExistingSubscriptions = _.map(object.subscriptions, function(row){
                        return row.name;
                    });

                    // Element is already in the subscriptions
                    if(IDSofExistingSubscriptions.indexOf(element.name) != -1){
                        reject("This element is already subscribed to the room");
                    }else{
                        var existingSubscriptions = object.subscriptions;
                            existingSubscriptions.push(element);

                        object.subscriptions = JSON.stringify({data: existingSubscriptions});
                        object.save(function(err){
                            if(err){ reject(err); }else{ resolve(); }
                        });
                    }
                }else{
                    reject("The room you are trying to subscribe the element to, does not exists");
                }
            });
        });
    };

    RealtimeSubscription.allOrdered = function(){
        return new Promise(function(resolve, reject) {
            RealtimeSubscription.find({}, function(err, results){
                if(!err){
                    var sorted = _.sortBy(results, function(row){
                        return new Date(row.created_at).getTime();
                    });

                    _.each(sorted, function(row){
                        row.subscriptions = JSON.parse(row.subscriptions).data;
                    });

                    resolve(sorted);
                }else{
                    reject(err);
                }
            });
        });
    };

    db.sync(function(){
        cb();
    });
};
