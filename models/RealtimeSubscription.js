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
    Promise.resolve(RealtimeSubscription.countSubscription().then(function(amount){
        if(!amount){ // No default subscription
            var defaultRealtimeSubs = '{"data":[{"room":"getDatabaseSchemaUpdates","subscriptions":[{"name":"databaseObject","parameters":[{"name":"id"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"928a65ae-1f6b-470e-ba19-457c69b0b5ad"},{"room":"addSectionMarketPlace","subscriptions":[{"name":"getSectionsMarketPlace","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"1e434eef-25a1-4c4d-a9e0-084c981cd70d"},{"room":"removeSectionDocumentation","subscriptions":[{"name":"getDocumentationTree","parameters":[]},{"name":"getDocumentationSection","parameters":[{"name":"id"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"67eb5953-52f3-4f75-97ce-cddcaaf71b9a"},{"room":"addUpdateDatabaseCredentials","subscriptions":[{"name":"getListOfDatabase","parameters":[]},{"name":"countDatabase","parameters":[]},{"name":"getListOfDatabaseWithType","parameters":[{"name":"type"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"9c674818-94e1-4441-8592-ac8488ebd931"},{"room":"updateWorkflow","subscriptions":[{"name":"getWorkflow","parameters":[{"name":"id"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"b8160f13-b50e-4fa4-9beb-80fe002171b0"},{"room":"superadminApproveComponent","subscriptions":[{"name":"superadminLoadMarketplaceValidationData","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"0ae8cf88-423b-40fe-9aa3-86dd28fe7020"},{"room":"addMemberToProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]},{"name":"teamMembersForProject","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"bfe7a6b9-a37b-42f2-96d7-a9a8a45f902a"},{"room":"removeProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"8936c486-0cd2-4125-82ba-f07c34f2d6d3"},{"room":"saveCardInfo","subscriptions":[{"name":"unreadNotification","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"c64a96a4-c986-4421-aa7f-1e61fadc55da"},{"room":"superadminRemoveRowFromModel","subscriptions":[{"name":"superadminContentOfModel","parameters":[{"name":"model"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"bf134b68-bd82-4c3a-8df1-89e1012c3009"},{"room":"removeSectionDocumentation","subscriptions":[],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:35:52.000Z","id":"bc82ce61-75cf-47af-9b2f-76ada9166009"},{"room":"deleteQuery","subscriptions":[{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"ca9334ff-18a6-4fe1-8946-2cb61268ec2b"},{"room":"selectFieldForQuery","subscriptions":[{"name":"getSelectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"getUnselectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"cfe20244-df22-4d0f-a777-360be39369bb"},{"room":"changePlan","subscriptions":[{"name":"userObject","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"f0821524-4578-4485-adf0-bf1d110fcc4e"},{"room":"userSettingSet","subscriptions":[{"name":"userSetting","parameters":[{"name":"key"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"c8b37ddf-e94d-4b2d-a7c2-ef8b18ddf410"},{"room":"setDefaultCard","subscriptions":[{"name":"getCardsListForUser","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"b16b6be4-e949-4599-b776-4053d6983cf0"},{"room":"cancelSubscription","subscriptions":[{"name":"userObject","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"c55b58fd-82d6-46a6-b69b-eed89c06e269"},{"room":"updateDocumentationSection","subscriptions":[{"name":"getDocumentationSection","parameters":[{"name":"id"}]},{"name":"getDocumentationTree","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"06c678ee-75fd-4828-9ab6-aa7d56347596"},{"room":"pickPlanForUser","subscriptions":[{"name":"userObject","parameters":[{"name":"id"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"e798135b-d805-42b4-a072-3f4c9128cc34"},{"room":"unSelectFieldForQuery","subscriptions":[{"name":"getSelectedFieldsForQuery","parameters":[{"name":"id_query"}]},{"name":"orderingRules","parameters":[{"name":"id_query"}]},{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"5dc90aad-1c33-49c5-ad60-5b39acb65572"},{"room":"createWorkflow","subscriptions":[],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:35:52.000Z","id":"a8cd32cd-9c8a-4560-86fb-9429f77e1a0f"},{"room":"removeOrderingRule","subscriptions":[{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"63cf8b8f-6913-44db-aefb-e5c035fc28ea"},{"room":"createQuery","subscriptions":[{"name":"countQueriesForUser","parameters":[]},{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"d2bd9211-56fb-4a81-ada4-b0a9219185d2"},{"room":"login","subscriptions":[{"name":"getCurrentSession","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"7b7078a1-1ae4-4f2d-b4e4-82ed42e50795"},{"room":"createOrderingRule","subscriptions":[{"name":"fieldsAvailableForOrderingInQuery","parameters":[{"name":"id_query"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"20b1727a-f1ff-4cef-afd5-4c7720de6c45"},{"room":"updateComponent","subscriptions":[{"name":"loadComponent","parameters":[{"name":"id"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"f0f4c17d-3f83-46ea-9add-1541960dd678"},{"room":"removeRowFromModel","subscriptions":[{"name":"superadminContentOfModel","parameters":[{"name":"model"}]},{"name":"superadminModelCount","parameters":[{"name":"model"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"1171dd4d-09fe-4345-be67-c9fcd49a779e"},{"room":"removeWorkflow","subscriptions":[{"name":"listOfWorkflows","parameters":[]},{"name":"getWorkflow","parameters":[{"name":"id"}]},{"name":"countWorkflow","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"cc557fe6-b8be-4c90-a7f4-dae7baf6c62d"},{"room":"removeComponent","subscriptions":[{"name":"listOfComponents","parameters":[]},{"name":"loadComponent","parameters":[{"name":"id"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"b19ba02c-9b5b-4943-b8a8-a9dfb2b72f57"},{"room":"removeDatabase","subscriptions":[{"name":"countDatabase","parameters":[]},{"name":"getListOfDatabaseWithType","parameters":[{"name":"type"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"4dd25ea0-0347-40c6-acc5-89fda8b1ecc6"},{"room":"deleteCard","subscriptions":[{"name":"getCardsListForUser","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"aa203967-cad7-4ba1-ad49-17bea3cbe9ef"},{"room":"superadminSubscribeFunctionToRealTime","subscriptions":[{"name":"listOfRealtimeSubscriptions","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"c88c1554-bd5b-422b-aeb0-b60e8ff07b2f"},{"room":"createComponent","subscriptions":[{"name":"listOfComponents","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"5f28b137-b26e-479a-8190-f4226378afe7"},{"room":"addUpdateProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"aa3ab1e2-f76e-4ffd-a90b-581bc8c61fe4"},{"room":"removeTeamMemberFromProject","subscriptions":[{"name":"projectList","parameters":[]},{"name":"teamMembersForProject","parameters":[{"name":"id_project"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"a575e87d-3b95-48b6-8ef5-501227f5798d"},{"room":"changeQueryDatastore","subscriptions":[{"name":"getUnselectedFieldsForQuery","parameters":[{"name":"id_query"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"ad6f7ff8-7f90-4b52-986b-646ace0d77b3"},{"room":"leaveProject","subscriptions":[{"name":"countProject","parameters":[]},{"name":"teamMembersForProject","parameters":[{"name":"id_project"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"740c002f-d0a8-4890-8675-905ba116947f"},{"room":"addSectionDocumentation","subscriptions":[{"name":"getDocumentationSection","parameters":[{"name":"id"}]},{"name":"getDocumentationTree","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"b3b90dc7-c53a-4fc9-836a-0b9ff65da8e6"},{"room":"changeMemberPermissionsForProject","subscriptions":[{"name":"teamMembersForProject","parameters":[{"name":"id_project"}]},{"name":"projectList","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"405ae5f9-ad65-4375-a549-a9bd5ed644fa"},{"room":"changeQueryName","subscriptions":[{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"afb94f2b-749d-4b92-be5b-8a4dcf07cf04"},{"room":"createOrUpdateProject","subscriptions":[{"name":"getProject","parameters":[{"name":"id_project"}]},{"name":"projectList","parameters":[]},{"name":"countProject","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-20T14:20:53.000Z","id":"7156be63-53eb-4dee-9ad8-b092bb41d5b4"},{"room":"removeSectionMarketPlace","subscriptions":[{"name":"getSectionsMarketPlace","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"6f4c00e5-e816-4ad3-ad12-05a93a97508e"},{"room":"changeOrderingForQueriesInProject","subscriptions":[{"name":"getQueriesForProject","parameters":[{"name":"id_project"}]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"37ad45aa-1fbc-4819-824f-77b18dd14d6f"},{"room":"createWorkflow","subscriptions":[{"name":"countWorkflow","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"355a24ff-9ed0-4b6c-8392-76d013f02288"},{"room":"setSettingsForOrderingDatabase","subscriptions":[{"name":"getListOfDatabase","parameters":[]}],"created_at":"2018-02-15T14:35:52.000Z","modified_at":"2018-02-15T14:59:44.000Z","id":"192fcc12-1910-46d5-861d-0353544156f1"}]}';
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
    }));

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
