var path            = require('path');
var redis           = require('node-orm2-redis');
var orm             = require(path.normalize(__dirname + '/../libraries/orm'));
var objectFormatter = require(path.normalize(__dirname + '/../helpers/objectFormatter'));
var userH           = require(path.normalize(__dirname + '/../helpers/user'));

module.exports = function (db, cb) {
    db.define('workflow', {
        name       : { type: "text" },
        user_id    : { type: "text" },
        id_project : { type: "text" },
        components : { type: "text" },
        inputs     : { type: "text" },
        outputs    : { type: "text" }
    }, {
        timestamp   : true,
        validations : {},
        indexes : {
            name    : redis.index.discrete,
            user_id : redis.index.discrete
        }
    });

    global.Workflow = db.models.workflow;

    // Create a new workflow
    // Params :
    // - (string)name          : The name to give to the component
    // - (string|object) user  : A user id or a user object
    // [return]Promise :
    //  - (object)success : The created object
    //  - (mixed)error    : Any error that has occured
    Workflow.createWorkflow = function(name, user, id_project){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Workflow.create({
                name          : name,
                user_id       : user_id,
                id_project    : id_project
            }, function(err, object){
                if(err){ reject(err); }else{ resolve(object); }
            });
        });
    };

    // Counts how many workflows are owned by a user
    // Params :
    // - (string|object) user : A user id or a user object
    // [return]Promise :
    //  - (Array)success : The amount of workflows that the user owns
    //  - (mixed)error   : Any error that has occured
    Workflow.countWorkflowForUser = function(user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Workflow.count({user_id: user_id}, function(err, amount){
                if(err){ reject(err); }else{ resolve(amount); }
            });
        });
    };

    // Returns the list of all the workflows owned by a user
    // Params :
    // - (string|object) user : A user id or a user object
    // [return]Promise :
    //  - (Array)success : The list of workflows that the user owns
    //  - (mixed)error   : Any error that has occured
    Workflow.workflowsForUser = function(user){
        var user_id = userH.userIdWithVar(user);

        return new Promise(function(resolve, reject) {
            Workflow.find({user_id: user_id}, function(err, workfs){
                if(err){ reject(err); }else{ resolve(workfs); }
            });
        });
    };

    // Return one workflow object using its ID
    // Params :
    // - (string)workflow_id : Id of the workflow to return
    // [return]Promise :
    //  - (object|boolean)success : Return the workflow object if found, return false if not found
    //  - (mixed)error            : Any error that has occured
    Workflow.workflowById = function(workflow_id){
        return new Promise(function(resolve, reject) {
            Workflow.one({id: workflow_id}, function(err, workflow){
                if(err){ reject(err); }else{
                    if(workflow){
                        if(workflow.inputs){
                            if(typeof(workflow.inputs) == "object" || workflow.inputs == "[object Object]"){
                                workflow.inputs = [];
                            }else{
                                workflow.inputs = JSON.parse(workflow.inputs).data;
                            }
                        }else{
                            workflow.inputs = [];
                        }

                        if(workflow.outputs){
                            if(typeof(workflow.outputs) == "object" || workflow.outputs == "[object Object]"){
                                workflow.outputs = [];
                            }else{
                                workflow.outputs = JSON.parse(workflow.outputs).data;
                            }
                        }else{
                            workflow.outputs = [];
                        }

                        if(workflow.components){
                            if(typeof(workflow.components) == "object" || workflow.components == "[object Object]"){
                                workflow.components = [];
                            }else{
                                workflow.components = JSON.parse(workflow.components).data;
                            }
                        }else{
                            workflow.components = [];
                        }

                        resolve(workflow);
                    }else{ resolve(false); }
                }
            });
        });
    };

    // Updates the properties of a workflow
    // Params :
    // - (object)data  : All of the properties to update with their values
    // - (string)workflow_id : Id of the component to update
    // [return]Promise :
    //  - (object)success : Returns the updated object
    //  - (mixed)error    : Any error that has occured
    Workflow.updateWorkflow = function(data, workflow_id){
        return new Promise(function(resolve, reject) {
            Workflow.workflowById(workflow_id).then(function(workflow){
                if(workflow){
                    _.each(Object.keys(data), function(key){
                        var dataToSave = data[key];

                        if(key == "inputs"){
                            if(Array.isArray(workflow.inputs)){
                                dataToSave = JSON.stringify({data: dataToSave});
                            }
                        }else{
                            if(Array.isArray(workflow.inputs)){
                                workflow.inputs = JSON.stringify({data: workflow.inputs});
                            }
                        }

                        if(key == "outputs"){
                            if(Array.isArray(workflow.outputs)){
                                dataToSave = JSON.stringify({data: dataToSave});
                            }
                        }else{
                            if(Array.isArray(workflow.outputs)){
                                workflow.outputs = JSON.stringify({data: workflow.outputs});
                            }
                        }

                        if(key == "components"){
                            if(Array.isArray(workflow.components)){
                                dataToSave = JSON.stringify({data: dataToSave});
                            }
                        }else{
                            if(Array.isArray(workflow.components)){
                                workflow.components = JSON.stringify({data: workflow.components});
                            }
                        }

                        workflow[key] = dataToSave;
                    });

                    workflow.save(function(err, object){
                        if(err){ reject(err); }else{ resolve(object); }
                    });
                }else{
                    reject("Undefined workflow");
                }
            }, reject);
        });
    };

    db.sync(function(){
        cb();
    });
};
