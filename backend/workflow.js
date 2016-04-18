var path       = require('path');
var _          = require('underscore');
var Promise    = require('promise');
var orm        = require(path.normalize(__dirname + '/../helpers/orm'));
var assets     = require(path.normalize(__dirname + '/../helpers/orm'));
var iv         = require(path.normalize(__dirname + '/../helpers/inputsValidation'));
var componentB = require(path.normalize(__dirname + '/component'));
var LIMIT_REQUESTS_FREE_PLAN = assets.LIMIT_REQUESTS_FREE_PLAN;

// Execute a workflow
// Params
// - (string)id_workflow: The id of the workflow
exports.executeWorkflow = function(request, response){
    orm.model(["Workflow"]).then(function(d){
        var id = request.params.id_workflow;
        var public_key = request.public_key;
        var valueInputs = {}; // That's the variable that stores all of the values steps after steps
        var workflow;

        var canContinue = true;
        new Promise(function(resolve, reject) {
            if(!id){
                reject();
                response.error({err: "Workflow id not provided", code: 103}, 103);
                canContinue = false;
            }else{
                resolve();
            }
        }).then(function(){
            if(canContinue){
                orm.model(["User", "Log", "Workflow"]).then(function(d){
                    var user = d.User.current(request);

                    d.Workflow.workflowById(id).then(function(object){
                        if(!object){
                            logObject.log += "Undefined workflow\n";
                            response.error("Undefined workflow", 104);
                        }else{
                            workflow = object;

                            var logObject = {
                                type_object: "workflow",
                                id_object: id,
                                log: ""
                            };

                            d.User.userByPublicKey(public_key).then(function(user){
                                if(parseInt(user.requests_executed) >= (LIMIT_REQUESTS_FREE_PLAN+parseInt(user.bonus_requests))
                                    && user.subscription != "mars"
                                    && user.subscription != "marsyear"
                                    && user.subscription != "superjedi"){
                                    response.error({err: "You have reached the limit of your FREE plan. Add a payment method to continue executing Workflows.", code: 108}, 108);
                                }else{
                                    logObject.id_user = user.id;

                                    var key_found = false;
                                    if(workflow.user_id == user.id || user.hasRole(["superadmin", "admin", "marketplaceValidation"])){
                                        key_found = true;
                                    }

                                    if(!key_found){
                                        logObject.log += "User with public key " + public_key + " is not allowed to execute the workflow\n";

                                        var helpToResolve = "";
                                        switch(type_request){
                                            case "REST":
                                                helpToResolve = "You need to provide your PUBLIC KEY in the header of your request (x-synchronise-public-key)";
                                                break;

                                            default:
                                                helpToResolve = "Perhaps you forgot to initialise the library? Synchronise.init('YOUR_PUBLIC_KEY')";
                                                break;
                                        }

                                        response.error({err: "You are not allowed to execute this workflow. " + helpToResolve, code: 105}, 105);
                                    }else{
                                        // CHECK THE INPUTS
                                        // Store the values of the inputs given to the workflow
                                        // The key is the index of the target from 0 to 1
                                        // If the value is given to the workflow directly the key is workflow
                                        valueInputs["workflow"] = _.extend(request.params);

                                        var missingParameters = [];
                                        var incorrectTypeParameters = [];

                                        for (var i = 0; i < workflow.inputs.length; i++) {
                                            var input = workflow.inputs[i];
                                            if(!valueInputs["workflow"].hasOwnProperty(input.name)){
                                                missingParameters.push(input);
                                            }else{
                                                if(!iv.isValid(valueInputs["workflow"][input.name], input.type)){
                                                    incorrectTypeParameters.push(input);
                                                }else{
                                                    valueInputs["workflow"][input.name] = iv.format(valueInputs["workflow"][input.name], input.type);
                                                }
                                            }
                                        }

                                        if(missingParameters.length){
                                            failed = true;

                                            var errorString = "Missing Inputs ";
                                            for(var i = 0; i < missingParameters.length; i++){
                                                var row = missingParameters[i];
                                                if(i !== 0){
                                                    errorString += ", ";
                                                }
                                                errorString += "(" + row.type[row.type.length-1] + ")"+row.name;
                                            }

                                            logObject.log += errorString + "\n";

                                            response.error({
                                                type: "workflow",
                                                status: "error",
                                                error: errorString,
                                                missing: missingParameters,
                                                code: 102
                                            }, 102);

                                        }else if(incorrectTypeParameters.length){
                                            failed = true;
                                        }else if(!workflow.components.length){
                                            failed = true;

                                            var errorString = "No components in the workflow. Please add at least one component.";
                                            logObject.log += errorString + "\n";

                                            response.error({
                                                type: "workflow",
                                                status: "error",
                                                error: errorString,
                                                missing: missingParameters,
                                                code: 106
                                            }, 106);
                                        }else{ // ALL GOOD WE CAN EXECUTE
                                            var succeeded, failed;
                                            var inputValues = _.extend({}, request.params);
                                            var components = workflow.components.slice(0);
                                            var componentsStillToExecute = components.slice(0);

                                            // Make sure the components are ordered
                                            _.sortBy(components, function(row){
                                                return row.order;
                                            });

                                            response.steps(components.length);

                                            function executeComponent(){
                                                var comp = componentsStillToExecute[0];
                                                var inputsForComponent = {};
                                                var keys = Object.keys(comp.inputs);

                                                var amountAlreadyExecuted = (componentsStillToExecute.length-1-components.length)*-1;

                                                for(var i = 0; i < keys.length; i++){
                                                    var currentKey = keys[i];
                                                    var rowInput = comp.inputs[currentKey];
                                                    var fromId = "workflow";
                                                    var fromName = rowInput.from.name;

                                                    if(rowInput.from.index == -1){
                                                        fromId = "workflow";
                                                    }else{
                                                        fromId = rowInput.from.index;
                                                    }

                                                    if(valueInputs.hasOwnProperty(fromId)){
                                                        if(valueInputs[fromId].hasOwnProperty(fromName)){
                                                            inputsForComponent[currentKey] = valueInputs[fromId][fromName];
                                                        }
                                                    }
                                                }

                                                componentB.executeComponent({
                                                    params: _.extend({
                                                        id_component: comp.id_component
                                                    }, inputsForComponent),
                                                    public_key: public_key
                                                }, {
                                                    success: function(data){
                                                        var amountAlreadyExecutedAfterThisOne = (componentsStillToExecute.length-1-components.length)*-1;
                                                        response.progress(amountAlreadyExecutedAfterThisOne, {
                                                            type: "component",
                                                            status: "success",
                                                            id: comp.id_component
                                                        });
                                                        valueInputs[amountAlreadyExecutedAfterThisOne-1+""] = data;
                                                        componentsStillToExecute.shift();
                                                        if(componentsStillToExecute.length){
                                                            executeComponent();
                                                        }else{
                                                            executionDone();
                                                        }
                                                    },
                                                    error: function(err, code){
                                                        var amountAlreadyExecutedAfterThisOne = (componentsStillToExecute.length-1-components.length)*-1;
                                                        response.error({
                                                            type: "component",
                                                            status: "error",
                                                            index: amountAlreadyExecutedAfterThisOne,
                                                            id: comp.id_component,
                                                            error:err
                                                        }, code);
                                                        failed = true;
                                                    }
                                                }, "REST");
                                            }

                                            function executionDone(data){
                                                if(!data){
                                                    data = {};
                                                }

                                                var missingOutputs = [];
                                                var incorrectTypeOutputs = [];

                                                for (var i = 0; i < workflow.outputs.length; i++) {
                                                    var output = workflow.outputs[i];

                                                    var parentName  = "workflow";
                                                    if(output.association.parent != "workflow"){
                                                        parentName = output.association.index_parent;
                                                    }

                                                    if(!valueInputs[parentName].hasOwnProperty(output.association.input_name)){
                                                        missingOutputs.push(output);
                                                    }else{
                                                        if(!iv.isValid(valueInputs[parentName][output.association.input_name], output.type)){
                                                            incorrectTypeOutputs.push(output);
                                                        }else{
                                                            data[output.name] = iv.format(valueInputs[parentName][output.association.input_name], output.type);
                                                        }
                                                    }
                                                }

                                                if(missingParameters.length){
                                                    failed = true;

                                                    var errorString = "Missing Inputs ";
                                                    for(var i = 0; i < missingParameters.length; i++){
                                                        var row = missingParameters[i];
                                                        if(i !== 0){
                                                            errorString += ", ";
                                                        }
                                                        errorString += "(" + row.type[row.type.length-1] + ")"+row.name;
                                                    }

                                                    logObject.log += errorString + "\n";

                                                    response.error({
                                                        type: "workflow",
                                                        status: "error",
                                                        error: errorString,
                                                        missing: missingParameters,
                                                        code: 102
                                                    }, 102);

                                                }else if(incorrectTypeParameters.length){
                                                    failed = true;
                                                }else{
                                                    console.log(data);

                                                    response.success({
                                                        type: "workflow",
                                                        id: id,
                                                        status: "Workflow executed successfully. You rock!",
                                                        data: data
                                                    });
                                                }
                                            }

                                            executeComponent();
                                        }
                                    }
                                }
                            });
                        }
                    });
                });
            }
        });
    });
};

// Count the amount of workflows for a user
exports.countWorkflow = function(request, response){
    orm.model(["User", "Workflow"]).then(function(d){
        var user = d.User.current(request);

        d.Workflow.countWorkflowForUser(user).then(function(amount){
            response.success({count: amount});
        }, response.error);
    });
};

// Returns the list of workflows for a user
exports.listOfWorkflows = function(request, response){
    var canContinue = true;

    orm.model(["User", "Workflow", "Project"]).then(function(d){
        var user = d.User.current(request);

        d.Workflow.workflowsForUser(user).then(function(workflows){
            var workflowsOk = [];
            var promises = [];
            var projects = {};

            // We need to verify for each Workflows if its project still exists
            // If it does not it means this Workflow is a left over of previous project that no longer exists,
            // and we need to remove the Workflow
            for(var i = 0; i < workflows.length; i++) {
                var workflow = workflows[i];
                promises.push(new Promise(function(resolve, reject) {
                    if(projects.hasOwnProperty(workflow.id_project)){
                        workflowsOk.push(workflow);
                        resolve();
                    }else{
                        d.Project.projectById(workflow.id_project).then(function(project){
                            if(project){
                                projects[workflow.id_project] = project;
                                workflowsOk.push(workflow);
                            }else{
                                workflow.remove();
                            }
                            resolve();
                        });
                    }
                }));
            }

            Promise.all(promises).then(function(){
                response.success(workflowsOk);
            });
        }, response.error);
    });
};

// Creates a new workflow
// Params :
// - (string)id_project: The id of the project to associate the workflow to
// - (string)name : Name of the workflow
exports.createWorkflow = function(request, response){
    var canContinue   = true;
    var name          = request.params.name;
    var id_project    = request.params.id_project;

    new Promise(function(resolve, reject) {
        // Name not provided
        if(!name.length){
            canContinue = false;
            response.error({err_type: "name", err: "Name for the component not provided"});
            reject();
        }else{
            resolve();
        }
    }).then(function(){
        if(canContinue){
            orm.model(["Workflow", "User", "Project"]).then(function(d){
                var user = d.User.current(request);

                d.Project.teamMembersForProject(id_project).then(function(members){
                    d.Workflow.createWorkflow(name, user, id_project).then(function(workflow){
                        response.success(workflow, 200, {}, _.map(members, function(row){
                            return row.id;
                        }));
                    }, function(err){
                        response.error({err_type: "workflowCreate", err: err});
                    });
                });
            });
        }
    });
};

// Remove a workflow
// Params
// - (string)id: The id of the workflow to remove
exports.removeWorkflow = function(request, response){
    orm.model(["User", "Workflow"]).then(function(d){
        var user = d.User.current(request);
        var id   = request.params.id;

        d.Workflow.workflowById(id).then(function(workflow){
            if(workflow.user_id != user.id){
                response.error("You do not have the right to remove this workflow");
            }else{
                workflow.remove(function(err){
                    if(err){ response.error(err); }else{ response.success("success", 200, {id:id}, [user.id]); }
                });
            }
        });
    });
};

// Get a workflow object using its ID
// Params
// - (string)id: the id of the workflow
exports.getWorkflow = function(request, response){
    orm.model(["User", "Workflow"]).then(function(d){
        var user = d.User.current(request);
        var id   = request.params.id;

        d.Workflow.workflowById(id).then(function(workflow){
            response.success(_.extend(workflow, {timestampRequest: request.handshake.issued})); // issued is used to avoid collissions on the interface
        }, function(err){
            response.error(err);
        });
    });
};

// Update a workflow
// Params
// - (string)id: the id of the workflow
// - (anyTypeOfData)data: the data to update on the object
exports.updateWorkflow = function(request, response){
    orm.model(["User", "Workflow"]).then(function(d){
        var user = d.User.current(request);
        var id   = request.params.id;
        var data = request.params.data;

        d.Workflow.updateWorkflow(data, id).then(function(workflow){
            response.success(workflow, 200, {id:id}, [user.id]);
        }, function(err){
            response.error(err);
        });
    });
};
