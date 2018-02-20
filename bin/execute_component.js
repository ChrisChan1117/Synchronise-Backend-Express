var vm                      = require("vm");
var path                    = require('path');
var _                       = require('underscore');
var iv                      = require(path.normalize(__dirname + '/../helpers/inputsValidation'));
var response                = {
    success: function(data){
        process.send({
            type: "success",
            data: data
        });
    },
    error: function(err, code){
        process.send({
            type: "error",
            err: err,
            code: code
        });
    },
    progress: function(progress, message){
        process.send({
            type: "progress",
            progress: progress,
            message: message
        });
    },
    log: function(data){
        process.send({
            type: "log",
            message: data
        });
    },
    logObject: function(){
        process.send({
            type: "logObject",
            object: logObject
        });
    }
};

var component               = process.argv[2];
var script                  = vm.createScript(component);
var subscription            = process.argv[5];
var logObject               = JSON.parse(process.argv[6]);
var incrementUsageUser      = function(){
    process.send({
        type: "incrementUsageUser"
    });
}

var dependencies            = {};
    dependencies.mailgun    = require('mailgun-js');
    dependencies.twilio     = require('twilio');
    dependencies.xero       = require('xero');
    dependencies.crypto     = require('crypto');
    dependencies.Lazy       = require('lazy');
    dependencies._l         = require('lodash');
    dependencies.IFTTTMaker = require('iftttmaker');
    dependencies.clearbit   = require('clearbit');
    dependencies.stripe     = require('stripe');
    dependencies.mysql      = require('mysql');
    dependencies.request    = require('request');
    dependencies.Promise    = require('promise'); // Promise library
    dependencies._          = _; // Underscore library
    dependencies.Buffer     = Buffer;

// Format the parameters
var parameters = JSON.parse(process.argv[3]);
var component_inputs = JSON.parse(process.argv[4]);
var component_outputs = JSON.parse(process.argv[7]);
var bypassVM = process.argv[8];

var missingParameters = [];
var incorrectTypeParameters = [];
for(var i = 0; i < component_inputs.length; i++) {
    var input = component_inputs[i];
    if(!parameters.hasOwnProperty(input.name) && !input.is_optional){
        missingParameters.push(input);
    }else{
        if(parameters.hasOwnProperty(input.name)){
            if(!iv.isValid(parameters[input.name], input.type) && !input.is_optional){
                incorrectTypeParameters.push(input);
            }else{
                parameters[input.name] = iv.format(parameters[input.name], input.type);
            }
        }
    }
}

var errorString;
if(missingParameters.length){
    errorString = "Missing Inputs ";
    for (var i = 0; i < missingParameters.length; i++) {
        var row = missingParameters[i];
        if(i !== 0){
            errorString += ", ";
        }
        errorString += "(" + row.type[row.type.length-1] + ")"+row.name;
    }

    logObject.log += errorString + "\n";

    response.error({
        error: errorString,
        missing: missingParameters,
        code: 102
    }, 102);

    process.send(logObject);
    process.exit(1);
}else if(incorrectTypeParameters.length){
    errorString = "Incorrect type Inputs";

    for (var i = 0; i < incorrectTypeParameters.length; i++) {
        var row = incorrectTypeParameters[i];
        if(index !== 0){
            errorString += ", ";
        }
        errorString += "(" + typeof(parameters[row.name]) + ")" + row.name + " - Expected: (" + row.type[row.type.length-1] + ")" + row.name;
    }

    logObject.log += errorString + "\n";

    response.error({
        error: errorString,
        incorrect : _.map(incorrectTypeParameters, function(row){
            return {
                given: {
                    name: row.name,
                    value: parameters[row.name],
                    type: typeof(parameters[row.name])
                },
                expected: row
            };
        }),
        code: 101
    }, 101);

    process.send(logObject);
    process.exit(1);
}else{ // Everything is fine, we can execute

    var succeeded = false;
    var failed    = false;
    var Output    = {};

    var sandbox = {
        success: function(data){
            if(!succeeded){
                if(typeof(data) === "object"){
                    Output = _.extend(data, Output);
                }

                // Save the usage of the FREE plan
                if(subscription == "earth"){
                    incrementUsageUser();
                }

                // Verify that we have all of the expected Outputs and that their type is correct
                var missingParameters = [];
                var incorrectTypeParameters = [];
                
                for (var i = 0; i < component_outputs.length; i++) {
                    var output = component_outputs[i];
                    if(!Output.hasOwnProperty(output.name)){
                        missingParameters.push(output);
                    }else{
                        if(!iv.isValid(Output[output.name], output.type)){
                            incorrectTypeParameters.push(output);
                        }else{
                            Output[output.name] = iv.format(Output[output.name], output.type);
                        }
                    }
                }

                var errorString;
                if(missingParameters.length){
                    failed = true;
                    errorString = "Missing Outputs ";
                    for (var i = 0; i < missingParameters.length; i++) {
                        var row = missingParameters[i];
                        if(i !== 0){
                            errorString += ", ";
                        }
                        errorString += "(" + row.type[row.type.length-1] + ")"+row.name;
                    }

                    logObject.log += errorString + "\n";

                    response.error({
                        error: errorString,
                        missing: missingParameters,
                        code: 107
                    }, 107);

                    response.logObject();
                    process.exit(1);
                }else if(incorrectTypeParameters.length){
                    failed = true;
                    errorString = "Incorrect type Outputs";

                    for (var i = 0; i < incorrectTypeParameters.length; i++) {
                        var row = incorrectTypeParameters[i];
                        if(i !== 0){
                            errorString += ", ";
                        }
                        errorString += "(" + typeof(Output[row.name]) + ")" + row.name + " - Expected: (" + row.type[row.type.length-1] + ")" + row.name;
                    }

                    logObject.log += errorString + "\n";

                    response.error({
                        error: errorString,
                        incorrect : _.map(incorrectTypeParameters, function(row){
                            return {
                                given: {
                                    name: row.name,
                                    value: Output[row.name],
                                    type: typeof(Output[row.name])
                                },
                                expected: row
                            };
                        }),
                        code: 106
                    }, 106);

                    response.logObject();
                    process.exit(1);
                }else{
                    succeeded = true;
                    var dataToAnswer = {};
                    if(typeof(data) == "object"){
                        dataToAnswer = _.extend(data, Output);
                    }else if(typeof(data) == "undefined"){
                        dataToAnswer = Output;
                    }else{
                        dataToAnswer = data;
                    }
                    response.success(dataToAnswer);
                    response.logObject();
                    process.exit(1);
                }
            }else{
                logObject.log += "success() has been called multiple times. Only one time is allowed!" + "\n";
                response.log("success() has been called multiple times. Only one time is allowed!");
                response.logObject();
            }
        },
        error: function(err, code){
            if(!failed){
                // Save the usage of the FREE plan
                if(subscription == "earth"){
                    incrementUsageUser();
                }

                if(typeof(err) == "undefined"){
                    logObject.log += "No error message provided on call of error();" + "\n";
                    response.log("No error message provided on call of error();");
                }else if(typeof(code) == "undefined"){
                    logObject.log += "No error code provided on call of error(); You must pass an error code as an integer as the second parameter of error(message, errorCode);" + "\n";
                    response.log("No error code provided on call of error();");
                }else if(typeof(code) !== "number"){
                    logObject.log += "The error code passed to error(); must be an integer" + "\n";
                    response.log("The error code passed to error(); must be an integer");
                }else if(code.toString().charAt(0) === "1" || code.toString().charAt(0) === "0"){
                    logObject.log += "The error code cannot start by a 1 or a 0, these are reserved numbers for Synchronise messages." + "\n";
                    response.log("The error code cannot start by a 1 or a 0, these are reserved numbers for Synchronise messages.");
                }else{
                    failed = true;
                    logObject.log += err + "\n";
                    response.error(err, code);
                    response.logObject();
                    process.exit(1);
                }
            }else{
                logObject.log += "error() has been called multiple times. Only one time is allowed!" + "\n";
                response.log("error() has been called multiple times. Only one time is allowed!");
                response.logObject();
                process.exit(1);
            }
        },
        progress: function(progress, message){
            logObject.log += "Progress: " + progress.toString() + " - Message: " + message.toString() + "\n";
            response.progress(progress, message);
        },
        console: {
            log : function(){ // Encapsulation of log
                for (var i = 0; i < arguments.length; i++) {
                    var row = arguments[i];
                    if(typeof(row) == "object"){
                        row = JSON.stringify(row);
                    }

                    logObject.log += row + "\n";
                    response.log(row);
                }
            }
        },
        Input: parameters, // Parameters coming from the client
        Output: Output
    };

    if(!bypassVM){
        script.runInNewContext(_.extend(dependencies, sandbox));
    }else{
        var success  = sandbox.success;
        var error    = sandbox.error;
        var progress = sandbox.progress;
        var console  = sandbox.console;
        var Input    = parameters;
        var Output   = Output;
        var keysDeps = Object.keys(dependencies);
        for (var i = 0; i < keysDeps.length; i++) {
            global[keysDeps[i]] = dependencies[keysDeps[i]];
        }
        eval(component);
    }

    process.on('uncaughtException', function(err) {
        response.log(err);
        logObject.log += err + "\n";

        process.send(logObject);
        process.exit(1);
    });
}
