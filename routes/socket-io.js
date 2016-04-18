var path                    = require('path');
var cookieParser            = require('cookie-parser');
var SessionSockets          = require('session.socket.io');
var _                       = require('underscore');
var adapter                 = require('socket.io-redis');
var stringSimilarity        = require('string-similarity');
var colors                  = require('colors'); // Color the console log
var assets                  = require(path.normalize(__dirname + '/../helpers/assets'));
var urlBodyParser           = require(path.normalize(__dirname + '/../helpers/urlBodyParser'));
var orm                     = require(path.normalize(__dirname + '/../helpers/orm'));

// Include all the controllers for the backend
var userB                   = require(path.normalize(__dirname + '/../backend/user'));
var projectB                = require(path.normalize(__dirname + '/../backend/project'));
var filesB                  = require(path.normalize(__dirname + '/../backend/files'));
var superadminB             = require(path.normalize(__dirname + '/../backend/superadmin'));
var userConnectionB         = require(path.normalize(__dirname + '/../backend/userConnection'));
var billingB                = require(path.normalize(__dirname + '/../backend/billing'));
var componentB              = require(path.normalize(__dirname + '/../backend/component'));
var workflowB               = require(path.normalize(__dirname + '/../backend/workflow'));
var logsB                   = require(path.normalize(__dirname + '/../backend/logs'));
var marketplaceB            = require(path.normalize(__dirname + '/../backend/marketplace'));

// Contains all the subscribtions of a the sockets
var publishRedisAdapter     = assets.publishRedisAdapter();
var subscriberRedisAdapter  = assets.subscriberRedisAdapter();

// Input :
// [Object]redis : redis store initialised already in app.js
// [Number]port : the port to use to listen for requests
module.exports = function(socket){
    socket.adapter(adapter({ pubClient: publishRedisAdapter, subClient: subscriberRedisAdapter }));

    socket.sockets.on('connection', function(currentSocket){
        // Execute Cloud.run functions
        currentSocket.on('Cloud.run', function (data) {
            // If the functions asked by the client exists
            if(typeof(CloudRunFunctions[data.room]) != "undefined"){
                data.channel = "Cloud.run";
                data.startTime = new Date();

                // Call the target function and provide arguments
                var shouldExecute = true;
                if(typeof(data.skipExecution) != "undefined"){
                    shouldExecute = !data.skipExecution;
                }

                if(shouldExecute){
                    var callback = CloudRunFunctions[data.room];
                    var target   = callback.target;
                    var expectedParameters = [];

                    if(typeof(callback.expectedParameters) != "undefined"){
                        expectedParameters = callback.expectedParameters;
                    }

                    urlBodyParser.parse(data, currentSocket, expectedParameters, function(request, response){
                        target(request, response);
                    }, function(request, parameters, users){
                        // Ping all of the subscriptions
                        orm.model("RealtimeSubscription").then(function(RealtimeSubscription){
                            RealtimeSubscription.subscriptionsForRoom(request.func).then(function(object){
                                if(object){
                                    for(var i = 0; i < object.subscriptions.length; i++){
                                        var currentObject = object.subscriptions[i];
                                        var data = {};

                                        // The subscriber wants some parameters
                                        if(currentObject.parameters.length){
                                            if(typeof(parameters) != "object"){
                                                console.log("The realtime subscription '" + currentObject.name.underline.yellow + "' called from '" + request.func.underline.yellow + "' needs some parameters");
                                                console.log(currentObject.parameters.yellow);
                                            }else{
                                                var providedParameters = Object.keys(parameters);
                                                var missingParameters = [];

                                                for(var j = 0; j < currentObject.parameters.length; j++){
                                                    // No default value provided for the field
                                                    if(typeof(currentObject.parameters[j].value) == "undefined"){
                                                        // The parameter has not been provided in the answer
                                                        if(providedParameters.indexOf(currentObject.parameters[j].name) == -1){
                                                            missingParameters.push(currentObject.parameters[j]);
                                                        }
                                                    }
                                                }

                                                if(!missingParameters.length){
                                                    // Format the data
                                                    for(var k = 0; k < currentObject.parameters.length; k++){
                                                        // No default value provided
                                                        if(typeof(currentObject.parameters[k].value) == "undefined"){
                                                            data[currentObject.parameters[k].name] = parameters[currentObject.parameters[k].name];
                                                        }else{
                                                            data[currentObject.parameters[k].name] = currentObject.parameters[k].value;
                                                        }
                                                    }
                                                }else{
                                                    console.log("The realtime subscription '" + currentObject.name.underline.yellow + "' called from '" + request.func.underline.yellow + "' needs some parameters");
                                                    console.log(missingParameters.yellow);
                                                }
                                            }
                                        }

                                        // We need an array of users
                                        var formattedUser = [];
                                        if(typeof(users) == "string"){ formattedUser = [users]; }else{ formattedUser = users; }
                                        sendPingForDataUpdated({
                                            func       : currentObject.name,
                                            parameters : data
                                        }, formattedUser);
                                    }
                                }
                            });
                        });
                    });
                }

                // If the function has a user in session and requires to be realtime
                if(data.realtime && typeof(currentSocket.handshake.session.user) != "undefined"){
                    var signature = "cloudrun"+data.identifier+currentSocket.handshake.session.user.id;
                    subscriberRedisAdapter.sub(signature, data.uniqueRequestID, currentSocket.id, function(message){
                        currentSocket.emit("Cloud.dataUpdate", {
                            channel    : data.channel,
                            identifier : data.identifier,
                            status     : 200
                        });
                    });
                }
            }else{
                // The function could not be found but maybe there is another one that has a close name
                var resultsSimilarity = [];
                for (var i = 0; i < CloudRunFunctions.length; i++) {
                    var row = CloudRunFunctions[i];
                    var similarity = stringSimilarity.compareTwoStrings(data.room, row.name);
                    if(similarity>0.5){
                        resultsSimilarity.push(row.name);
                    }
                }

                if(resultsSimilarity.length){
                    console.log('The function \'' + data.room.underline.yellow + '\' you have called does not exists. Did you mean any of these? :');
                    for (var i = 0; i < resultsSimilarity.length; i++) {
                        var row = resultsSimilarity[i];
                        console.log('-'+row.yellow);
                    }
                }else{
                    console.log('The function \'' + data.room.underline.yellow + '\' you have called does not exists');
                }
            }
        });

        // Unsubscibe a client from a specific realtime
        currentSocket.on('Cloud.unsubscribeRealtime', function(data){
            subscriberRedisAdapter.unsub(data.uniqueID);
        });

        // The user has given us a password to authenticate for a sensitive backend function
        currentSocket.on('Cloud.passwordForAuthentication', function(data){
            publishRedisAdapter.pub("cloudpasswordForAuthentication"+currentSocket.handshake.session.user.id, data);
        });

        // The user has aborted the authentication
        currentSocket.on('Cloud.passwordAuthenticationAborted', function(data){
            publishRedisAdapter.pub("cloudpasswordAuthenticationAborted"+currentSocket.handshake.session.user.id, data);
        });

        currentSocket.on('disconnect', function(data, socket) {
            // Remove the subscriptions
            for (var i = 0; i < assets.subscribers.length; i++) {
                var subscribtion = assets.subscribers[i];
                if(subscribtion.id_socket == currentSocket.id){
                    delete assets.subscribers[i];
                }
            }
        });
    });
};

function paramsToStringOrderedAlphabetically(params) {
    var orderedList = _.sortBy(Object.keys(params), function(key){
        return key;
    });

    var string = "";
    for (var i = 0; i < orderedList.length; i++) {
        var item = orderedList[i];
        if(item != "realtime"){ // Escape the realtime paramater
            string+=item+params[item];
        }

    }

    return string;
}

// See README for a lot more information about this functionality
// Tell all the remotes to reload all the callbacks that are linked to the given functionName
// Input :
// [String]functionName : name of the function to reload on the remotes
function sendPingForDataUpdated(identifier, users){
    var promises;
    if(typeof(identifier) == "string"){ // String given
        if(typeof(users) != "undefined"){
            // For each users (needs to compose the ping string for all users)
            promises = Array();
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                promises.push("cloudrun"+identifier+user, {});
            }
            return Promise.all(promises);
        }else{
            return publishRedisAdapter.pub("cloudrun"+identifier, {});
        }
    }else{ // Object given
        var realtimesignature = "";
            realtimesignature = identifier.func;
        if(typeof(identifier.parameters) != "undefined"){
            realtimesignature+= paramsToStringOrderedAlphabetically(identifier.parameters);
        }

        if(typeof(users) != "undefined"){
            promises = Array();
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                promises.push(publishRedisAdapter.pub("cloudrun"+realtimesignature+user, {}));
            }
            return Promise.all(promises);
        }else{
            realtimesignature += identifier.user;
            return publishRedisAdapter.pub("cloudrun"+realtimesignature, {});
        }
    }
}
exports.sendPingForDataUpdated = sendPingForDataUpdated;

// Will ask the user to type his/her password before proceeding to the next step
// res : The resource of the current request
// identifier : The identifier of the function that was required to be executed
// reason : The reason why we need to obtain the password
exports.requirePassword = function(request, response, reason){
    return new Promise(function(resolve, reject){
        var status = 418;

        var message = JSON.stringify({
            reason : reason
        });

        request.socket.emit("Cloud.requiresPassword", {
            status     : status,
            message    : message,
            identifier : request.identifier
        });

        subscriberRedisAdapter.sub("cloudpasswordForAuthentication"+request.handshake.session.user.id, "cpfa"+request.identifier, request.id, function(message){
            subscriberRedisAdapter.unsub("cpfa"+request.identifier);
            subscriberRedisAdapter.unsub("cpfaa"+request.identifier);
            resolve(message.params.password);
        });

        subscriberRedisAdapter.sub("cloudpasswordAuthenticationAborted"+request.handshake.session.user.id, "cpfaa"+request.identifier, request.id, function(message){
            subscriberRedisAdapter.unsub("cpfa"+request.identifier);
            subscriberRedisAdapter.unsub("cpfaa"+request.identifier);
            reject("aborted");
        });
    });
};

var CloudRunFunctions = {
    // USER
    "registerAlpha": {
        name   : "registerAlpha",
        target : userB.registerAlpha,
        expectedParameters: [{
            name: "email",
            type: ["string"]
        }]
    },
    "shouldLoginOrSignup":{ // Answers "login" or signup in regards to an email address (username)
        name   : "shouldLoginOrSignup",
        target : userB.shouldLoginOrSignup,
        expectedParameters: [{
            name: "email",
            type: ["string"]
        }]
    },
    "signup":{ // Signup a new user
        name   : "signup",
        target : userB.signup,
        expectedParameters: [{
            name: "email",
            type: ["string"]
        }, {
            name: "password",
            type: ["string"]
        }, {
            name: "name",
            type: ["string"]
        }]
    },
    "login":{ // Login the user with its email (username) and password
        name   : "login",
        target : userB.login,
        expectedParameters: [{
            name: "email",
            type: ["string"]
        }, {
            name: "password",
            type: ["string"]
        }]
    },
    "userObject": {
        name   : "userObject",
        target : userB.userObject,
        expectedParameters: [{
            name: "user_id", // Can either be an ID or a user email address
            type: ["string"]
        }]
    },
    "getCurrentSession": {
        name   : "getCurrentSession",
        target : userB.getCurrentSession
    },
    "dashboardMenuCollapsed":{
        name   : "dashboardMenuCollapsed",
        target : userB.dashboardMenuCollapsed
    },
    "userSetting":{
        name   : "userSetting",
        target : userB.userSetting,
        expectedParameters: [{
            name: "key",
            type: ["string"]
        }]
    },
    "userSettingSet":{
        name   : "userSettingSet",
        target : userB.userSettingSet,
        expectedParameters: [{
            name: "key",
            type: "string"
        }, {
            name: "value",
            type: ["string", "number", "boolean", "object", "function", "null", "undefined"]
        }]
    },
    "unreadNotification":{
        name   : "unreadNotification",
        target : userB.unreadNotification
    },
    "createPublicKey":{
        name   : "createPublicKey",
        target : userB.createPublicKey,
        expectedParameters: [{
            name: "type",
            type: ["string"]
        }]
    },
    "userHasValidPaymentMethod":{
        name   : "userHasValidPaymentMethod",
        target : userB.userHasValidPaymentMethod
    },
    "recoverPassword":{
        name   : "recoverPassword",
        target : userB.recoverPassword,
        expectedParameters: [{
            name: "email",
            type: ["string"]
        }]
    },

    // BILLING
    "saveCardInfo":{
        name   : "saveCardInfo",
        target : billingB.saveCardInfo,
        expectedParameters: [{
            name: "token",
            type: ["string"]
        }, {
            name: "type",
            type: ["string"]
        }, {
            name: "exp_month",
            type: ["string", "number"]
        }, {
            name: "exp_year",
            type: ["string", "number"]
        }, {
            name: "firstname",
            type: ["string", "undefined"]
        }, {
            name: "surname",
            type: ["string", "undefined"]
        }, {
            name: "company",
            type: ["string", "undefined"]
        }]
    },
    "getCardsListForUser":{
        name   : "getCardsListForUser",
        target : billingB.getCardsListForUser
    },
    "setDefaultCard":{
        name   : "setDefaultCard",
        target : billingB.setDefaultCard,
        expectedParameters: [{
            name: "id_card",
            type: ["string"]
        }]
    },
    "deleteCard":{
        name   : "deleteCard",
        target : billingB.deleteCard,
        expectedParameters: [{
            name: "id_card",
            type: ["string"]
        }]
    },
    "changePlan":{
        name   : "changePlan",
        target : billingB.subscribeToPlan,
        expectedParameters: [{
            name: "plan",
            type: ["object"]
        }]
    },
    "getBitLyForReferral":{
        name   : "getBitLyForReferral",
        target : billingB.getBitLyForReferral
    },
    "cancelSubscription":{
        name   : "cancelSubscription",
        target : billingB.cancelSubscription
    },
    "applyCoupon":{
        name   : "applyCoupon",
        target : billingB.applyCoupon,
        expectedParameters: [{
            name: "coupon",
            type: ["string"]
        }]
    },
    "listOfInvoicesForUser":{
        name   : "listOfInvoicesForUser",
        target : billingB.listOfInvoicesForUser
    },

    // PROJECT
    "createOrUpdateProject":{
        name   : "addUpdateProject",
        target : projectB.addUpdateProject
    },
    "projectList":{
        name   : "projectList",
        target : projectB.projectList
    },
    "projectsListWithComponents":{
        name   : "projectsListWithComponents",
        target : projectB.projectsListWithComponents
    },
    "projectsListWithComponentsForWorkflow":{
        name   : "projectsListWithComponentsForWorkflow",
        target : projectB.projectsListWithComponentsForWorkflow
    },
    "getProject": {
        name   : "getProject",
        target : projectB.getProject,
        expectedParameters: [{
            name: "id_project",
            type: ["string"]
        }]
    },
    "countProject": {
        name   : "countProject",
        target : projectB.countProject
    },
    "removeProject":{
        name   : "removeProject",
        target : projectB.removeProject,
        expectedParameters: [{
            name: "id_project",
            type: ["string"]
        }]
    },
    "teamMembersForProject":{
        name   : "teamMembersForProject",
        target : projectB.teamMembersForProject,
        expectedParameters: [{
            name: "id_project",
            type: ["string"]
        }]
    },
    "addMemberToProject": {
        name   : "addMemberToProject",
        target : projectB.addMemberToProject,
        expectedParameters: [{
            name: "id_project",
            type: ["string"]
        }, {
            name: "searchString",
            type: ["string"]
        }, {
            name: "permissions",
            type: ["object"]
        }]
    },
    "removeTeamMemberFromProject": {
        name   : "removeTeamMemberFromProject",
        target : projectB.removeTeamMemberFromProject,
        expectedParameters:[{
            name: "id_project",
            type: ["string"]
        }, {
            name: "id_team_member",
            type: ["string"]
        }]
    },
    "leaveProject": {
        name   : "leaveProject",
        target : projectB.leaveProject,
        expectedParameters:[{
            name: "id_project",
            type: ["string"]
        }]
    },
    "changeMemberPermissionsForProject": {
        name   : "changeMemberPermissionsForProject",
        target : projectB.changeMemberPermissionsForProject,
        expectedParameters:[{
            name: "id_project",
            type: ["string"]
        }, {
            name: "id_team_member",
            type: ["string"]
        }, {
            name: "permissions",
            type: ["object"]
        }]
    },
    "deleteBrokenProjects": {
        name: "deleteBrokenProjects",
        target: projectB.deleteBrokenProjects
    },

    // UPLOAD
    "uploadGetSignature":{
        name   : "uploadGetSignature",
        target : filesB.getSignature,
        expectedParameters:[{
            name: "folder",
            type: ["string"]
        }, {
            name: "file_type",
            type: ["string"]
        }]
    },

    // USER CONNECTIONS
    "getUserConnections": {
        name: "getUserConnections",
        target: userConnectionB.getUserConnections,
        expectedParameters:[{
            name: "user_object",
            type: ["object", "boolean"]
        }]
    },
    "addUserConnection": {
        name: "addUserConnection",
        target: userConnectionB.addUserConnection,
        expectedParameters:[{
            name: "user_id_1",
            type: ["string"]
        }, {
            name: "user_id_2",
            type: ["string"]
        }]
    },
    "deleteUserConnection": {
        name: "deleteUserConnection",
        target: userConnectionB.deleteUserConnection,
        expectedParameters:[{
            name: "user_id_1",
            type: ["string"]
        }, {
            name: "user_id_2",
            type: ["string"]
        }]
    },
    "deleteAllUserConnections": {
        name: "deleteAllUserConnections",
        target: userConnectionB.deleteAllUserConnections,
        expectedParameters:[{
            name: "user_id",
            type: ["string"]
        }]
    },
    "countReferrals": {
        name: "countReferrals",
        target: userConnectionB.countReferrals,
    },

    // SUPERADMIN
    "superadminFlushDB":{ // Flushes the entire database
        name   : "superadminFlushDB",
        target : superadminB.wipeDatabase
    },
    "superadminFlushModel":{ // Flushes a model
        name   : "superadminFlushModel",
        target : superadminB.wipeModel,
        expectedParameters:[{
            name: "model",
            type: ["string"]
        }]
    },
    "superadminModelCount":{ // Count how many records there is in one specific model
        name   : "superadminModelCount",
        target : superadminB.modelItemsCount,
        expectedParameters:[{
            name: "model",
            type: ["string"]
        }]
    },
    "superadminContentOfModel":{
        name   : "superadminContentOfModel",
        target : superadminB.contentOfModel,
        expectedParameters:[{
            name: "model",
            type: ["string"]
        }]
    },
    "superadminModelList":{ // List all of the models
        name   : "superadminModelList",
        target : superadminB.modelList
    },
    "superadminPopulateDatabase":{
        name   : "superadminPopulateDatabase",
        target : superadminB.populateDatabase,
        expectedParameters:[{
            name: "email",
            type: ["string"]
        }]
    },
    "superadminRemoveRowFromModel":{
        name   : "superadminRemoveRowFromModel",
        target : superadminB.removeRowFromModel,
        expectedParameters:[{
            name: "model",
            type: ["string"]
        }, {
            name: "id",
            type: ["string"]
        }]
    },
    "superadminSubscribeFunctionToRealTime":{
        name   : "superadminSubscribeFunctionToRealTime",
        target : superadminB.subscribeFunctionToRealTime,
        expectedParameters:[{
            name: "room",
            type: ["string"]
        }, {
            name: "name",
            type: ["string"]
        }, {
            name: "parameters",
            type: ["object"]
        }]
    },
    "superadminPopulateWhiteList":{
        name   : "superadminPopulateWhiteList",
        target : superadminB.superadminPopulateWhiteList,
        expectedParameters:[{
            name: "email",
            type: ["string"]
        }]
    },
    "listOfRealtimeSubscriptions":{
        name   : "listOfRealtimeSubscriptions",
        target : superadminB.listOfRealtimeSubscriptions
    },
    "superadminRemovePermissionForUser":{
        name   : "superadminRemovePermissionForUser",
        target : superadminB.superadminRemovePermissionForUser,
        expectedParameters:[{
            name: "id_role",
            type: ["string"]
        }, {
            name: "id_user",
            type: ["string"]
        }]
    },
    "superadminAddPermissionForUser":{
        name   : "superadminAddPermissionForUser",
        target : superadminB.superadminAddPermissionForUser,
        expectedParameters:[{
            name: "role_name",
            type: ["string"]
        }, {
            name: "id_user",
            type: ["string"]
        }]
    },
    "superadminChangePlanForUser":{
        name   : "superadminChangePlanForUser",
        target : superadminB.superadminChangePlanForUser,
        expectedParameters: [{
            name: "email_user",
            type: ["string"]
        }, {
            name: "plan",
            type: ["string"]
        }]
    },
    "superadminLoadMarketplaceValidationData":{
        name   : "superadminLoadMarketplaceValidationData",
        target : superadminB.superadminLoadMarketplaceValidationData
    },
    "superadminApproveComponent":{
        name   : "superadminApproveComponent",
        target : superadminB.superadminApproveComponent,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        }]
    },
    // COMPONENT
    "executeComponent":{
        name   : "executeComponent",
        target : componentB.executeComponent,
        expectedParameters:[{
            name: "id_component",
            type: ["string"]
        }]
    },
    "createComponent":{
        name   : "createComponent",
        target : componentB.createComponent,
        expectedParameters:[{
            name: "code",
            type: ["string"]
        }, {
            name: "name",
            type: ["string"]
        }]
    },
    "updateComponent":{
        name   : "updateComponent",
        target : componentB.updateComponent,
        expectedParameters:[{
            name: "data",
            type: ["object"]
        }, {
            name: "id",
            type: ["string"]
        }]
    },
    "listOfComponents":{
        name   : "listOfComponents",
        target : componentB.listOfComponents
    },
    "getComponentsForProject":{
        name   : "getComponentsForProject",
        target : componentB.getComponentsForProject,
        expectedParameters:[{
            name: "id",
            type: ["string"]
        }]
    },
    "getComponentsForProjectForWorkflow":{
        name   : "getComponentsForProjectForWorkflow",
        target : componentB.getComponentsForProjectForWorkflow,
        expectedParameters:[{
            name: "id",
            type: ["string"]
        }]
    },
    "loadComponent":{
        name   : "loadComponent",
        target : componentB.loadComponent,
        expectedParameters: [{
            name : "id",
            type : ["string"]
        }]
    },
    "countComponent":{
        name   : "countComponent",
        target : componentB.countComponent
    },
    "removeComponent":{
        name   : "removeComponent",
        target : componentB.removeComponent
    },
    "cloneComponent":{
        name   : "cloneComponent",
        target : componentB.cloneComponent,
        expectedParameters:[{
            name: "id",
            type: ["string"]
        }]
    },
    "lastComponentsForUser":{
        name   : "lastComponentsForUser",
        target : componentB.lastComponentsForUser
    },

    // WORKFLOW
    "countWorkflow":{
        name   : "countWorkflow",
        target : workflowB.countWorkflow
    },
    "listOfWorkflows":{
        name   : "listOfWorkflows",
        target : workflowB.listOfWorkflows
    },
    "createWorkflow":{
        name   : "createWorkflow",
        target : workflowB.createWorkflow,
        expectedParameters:[{
            name: "name",
            type: ["string"]
        }, {
            name: "id_project",
            type: ["string"]
        }]
    },
    "removeWorkflow":{
        name   : "removeWorkflow",
        target : workflowB.removeWorkflow,
        expectedParameters: [{
            name : "id",
            type : ["string"]
        }]
    },
    "getWorkflow":{
        name   : "getWorkflow",
        target : workflowB.getWorkflow,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        }]
    },
    "updateWorkflow":{
        name: "updateWorkflow",
        target: workflowB.updateWorkflow,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        },{
            name: "data",
            type: ["object"]
        }]
    },
    "executeWorkflow":{
        name: "executeWorkflow",
        target: workflowB.executeWorkflow,
        expectedParameters: [{
            name: "id_workflow",
            type: ["string"]
        }]
    },

    /*
    Not fully implemented
    // LOGS
    "pickPlanForUser": {
        name   : "pickPlanForUser",
        target : logsB.pickPlanForUser,
        expectedParameters: [{
            name: "plan",
            type: ["string"]
        }]
    },
    "lastLogForTypeForUser":{
        name   : "lastLogForTypeForUser",
        target : logsB.lastLogForTypeForUser,
        expectedParameters: [{
            name: "type",
            type: ["string"]
        }]
    },
    */

    // MARKET PLACE
    "marketPlaceHeaderCarousel": {
        name: "marketPlaceHeaderCarousel",
        target: marketplaceB.marketPlaceHeaderCarousel
    },
    "getSectionsMarketPlace": {
        name: "getSectionsMarketPlace",
        target: marketplaceB.getSectionsMarketPlace
    },
    "addSectionMarketPlace": {
        name: "addSectionMarketPlace",
        target: marketplaceB.addSectionMarketPlace
    },
    "getSectionMarketPlaceById":{
        name: "getSectionMarketPlaceById",
        target: marketplaceB.getSectionMarketPlaceById,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        }]
    },
    "updateSectionMarketPlace": {
        name: "updateSectionMarketPlace",
        target: marketplaceB.updateSectionMarketPlace,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        }]
    },
    "removeSectionMarketPlace": {
        name: "removeSectionMarketPlace",
        target: marketplaceB.removeSectionMarketPlace,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        }]
    },
    "searchForItemsInMarketPlace": {
        name: "searchForItemsInMarketPlace",
        target: marketplaceB.searchForItemsInMarketPlace,
        expectedParameters: [{
            name: "type",
            type: ["string"]
        }, {
            name: "search",
            type: ["string"]
        }]
    },
    "lastPublishedProjects": {
        name: "lastPublishedProjects",
        target: marketplaceB.lastPublishedProjects
    }

    /*
    No longer supported
    // DATABASE
    "databaseObject":{ // Return an object of database using its ID
        name   : "databaseObject",
        target : databaseB.getDataStore,
        expectedParameters: [{
            name: "id",
            type: ["string"]
        }]
    },
    "countDatabase": { // Return the amount of databases of a user
        name   : "countDatabase",
        target : databaseB.countDatabase
    },
    "getListOfDatabase":{ // Return the list of databases of a type for a user
        name   : "getListOfDatabase",
        target : databaseB.getListOfDatabase
    },
    "getListOfDatabaseWithType":{ // Return the list of databases of a type for a user
        name   : "getListOfDatabaseWithType",
        target : databaseB.getListOfDatabaseWithType,
        expectedParameters: [{
            name: "type",
            type: ["string"]
        }]
    },
    "addUpdateDatabaseCredentials":{ // Insert a new database credentials
        name   : "addUpdateDatabaseCredentials",
        target : databaseB.addUpdateDatabaseCredentials,
        expectedParameters: [{
            name: "objectId",
            type: ["string", "null", "undefined"]
        }, {
            name: "title",
            type: ["string"]
        }, {
            name: "name",
            type: ["string"]
        }, {
            name: "url",
            type: ["string"]
        }, {
            name: "username",
            type: ["string"]
        }, {
            name: "password",
            type: ["string"]
        }, {
            name: "port",
            type: ["string", "null", "undefined"]
        }, {
            name: "type",
            type: ["string"]
        }, {
            name: "masterType",
            type: ["string"]
        }, {
            name: "limit",
            type: ["string", "null", "undefined"]
        }]
    },
    "removeDatabase":{
        name   : "removeDatabase",
        target : databaseB.removeDatabase,
        expectedParameters: [{
            name: "databaseId",
            type: ["string"]
        }]
    },
    "tableCollectionList":{
        name   : "tableCollectionList",
        target : databaseB.tableCollectionList,
        expectedParameters: [{
            name: "databaseId",
            type: ["string"]
        }]
    },
    "tableCollectionListDistant":{
        name   : "tableCollectionListDistant",
        target : databaseB.tableCollectionListDistant,
        expectedParameters: [{
            name: "databaseId",
            type: ["string"]
        }, {
            name: "password",
            type: ["string"]
        }]
    },
    "setSettingsForOrderingDatabase":{
        name   : "setSettingsForOrderingDatabase",
        target : databaseB.setSettingsForOrdering,
        expectedParameters: [{
            name: "value",
            type: ["string"]
        }]
    },
    "getDatabaseSchemaUpdates":{
        name   : "getDatabaseSchemaUpdates",
        target : databaseB.getDatabaseSchemaUpdates,
        expectedParameters: [{
            name: "idDatabase",
            type: ["string"]
        }]
    },
    "getDataStoreSchema": {
        name   : "getDataStoreSchema",
        target : databaseB.getDataStoreSchema,
        expectedParameters: [{
            name: "db_id",
            type: ["string"]
        }]
    },
    "getTypeOfDatastores": {
        name   : "getTypeOfDatastores",
        target : databaseB.getTypeOfDatastores,
    },
    "getExampleResult": {
        name   : "getExampleResult",
        target : databaseB.getExampleResult,
        expectedParameters: [{
            name: "query_id",
            type: ["string"]
        }]
    }

    // QUERY
    "getQueriesForProject":{
        name : "getQueriesForProject",
        target : queryB.getQueriesForProject,
        expectedParameters:[{
            name: "id_project",
            type: ["string"]
        }]
    },
    "changeOrderingForQueriesInProject":{
        name : "changeOrderingForQueriesInProject",
        target : queryB.changeOrderingForQueriesInProject,
        expectedParameters:[{
            name: "id_project",
            type: ["string"]
        }, {
            name: "ordering",
            type: ["object"]
        }]
    },
    "fieldsAvailableForOrderingInQuery": {
        name : "fieldsAvailableForOrderingInQuery",
        target : queryB.fieldsAvailableForOrderingInQuery,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }]
    },
    "getQuery":{
        name : "getQuery",
        target : queryB.getQuery,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }]
    },
    "createQuery":{
        name : "createQuery",
        target : queryB.createQuery,
        expectedParameters:[{
            name: "id_project",
            type: ["string"]
        }, {
            name: "id_db",
            type: ["string"]
        }, {
            name: "type",
            type: ["string"]
        }, {
            name: "db_type",
            type: ["string"]
        }]
    },
    "changeQueryName":{
        name : "changeQueryName",
        target : queryB.changeQueryName,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }, {
            name: "name",
            type: ["string"]
        }]
    },
    "changeQueryDatastore":{
        name : "changeQueryDatastore",
        target : queryB.changeQueryDatastore,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }, {
            name: "id_db",
            type: ["string"]
        }, {
            name: "db_type",
            type: ["string"]
        }]
    },
    "getSelectedFieldsForQuery": {
        name   : "getSelectedFieldsForQuery",
        target : queryB.getSelectedFieldsForQuery,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }]
    },
    "getUnselectedFieldsForQuery":{
        name   : "getUnselectedFieldsForQuery",
        target : queryB.getUnselectedFieldsForQuery,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }]
    },
    "selectFieldForQuery": {
        name   : "selectFieldForQuery",
        target : queryB.selectFieldForQuery,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }, {
            name: "field_id",
            type: ["string"]
        }]
    },
    "unSelectFieldForQuery": {
        name   : "unSelectFieldForQuery",
        target : queryB.unSelectFieldForQuery,
        expectedParameters:[{
            name: "id",
            type: ["string"]
        }, {
            name: "id_query",
            type: ["string"]
        }]
    },
    "deleteQuery":{
        name   : "deleteQuery",
        target : queryB.deleteQuery,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }]
    },
    "orderingRules":{
        name   : "orderingRules",
        target : queryB.orderingRules,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }]
    },
    "createOrderingRule":{
        name   : "createOrderingRule",
        target : queryB.createOrderingRule,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }, {
            name: "id_field",
            type: ["string"]
        }]
    },
    "removeOrderingRule":{
        name   : "removeOrderingRule",
        target : queryB.removeOrderingRule,
        expectedParameters:[{
            name: "id_query",
            type: ["string"]
        }, {
            name: "id_rule",
            type: ["string"]
        }]
    },
    "displayedFields":{
        name   : "displayedFields",
        target : queryB.displayedFields,
        expectedParameters:[{
            name: "query_id",
            type: ["string"]
        }]
    },
    "listFieldsAvailable":{
        name   : "listFieldsAvailable",
        target : queryB.displayedFields,
        expectedParameters:[{
            name: "query_id",
            type: ["string"]
        }]
    },
    "countQueriesForUser":{
        name   : "countQueriesForUser",
        target : queryB.countQueriesForUser
    }
    */
};
