var path    = require('path');
var Promise = require('promise');
var _       = require('underscore');
var colors  = require('colors');
var orm     = require(path.normalize(__dirname + '/../helpers/orm'));

exports.parse = function(req, res, expectedParameters, callback, socketiomanagercallbacksuccess){
    var request = {
        params: {},
        session: {}
    };

    request.params     = req.params; // PARAMETERS
    request.public_key = req.pk;
    request.session    = res.session; // SESSION DATA
    request.handshake  = res.handshake; // CONNECTION DATA
    request.identifier = req.identifier; // UNIQUE ID OF THE REQUEST
    request.id         = res.id; // UNIQUE ID OF THE CONNECTION
    request.socket     = res;
    request.func       = req.room;

    var status;
    var message;

    var response  =  {
        id         : req.uniqueRequestID,
        realtimeId : req.realtimeRequestID,
        req        : req,
        res        : res,
        identifier : req.identifier,
        room       : req.room,
        channel    : req.channel,
        startTime  : req.startTime,
        totalSteps : 1, // How many steps there is to complete the program
        stepsDone  : 0, // How many steps we have completed already
        steps      : function(steps){
            if(steps > 0){
                this.totalSteps = steps;
            }
        },
        // Message    : Any String or object you want to send back to the client
        // Code       : Code to send to the client, default 20O
        // Parameters : Parameters to use for realtime matching
        // Recipients : List of IDS of users to send the realtime notification to
        success    : function(message, code, parameters, recipients){
             // Ignore log messages for the steps
            if(code != 226){
                if(this.stepsDone<this.steps){
                    this.stepsDone++;
                }
            }

            if(typeof(code) == "undefined"){
                status = 200;
            }else{
                status = code;
            }

            if(typeof(message) == "string"){
                message = JSON.stringify({
                    status: message
                });
            }else if(typeof(message) != "undefined" &&
                    message !== null){
                message = JSON.stringify(message);
            }else{
                message = JSON.stringify("{}");
            }

            var endTime = new Date();

            this.res.emit(this.channel, {
                status           : status,
                message          : message,
                identifier       : this.identifier,
                room             : this.room,
                uniqueRequestID  : this.id,
                uniqueRealtimeID : this.realtimeId,
                steps            : this.totalSteps,
                stepsDone        : this.stepsDone,
                executionTime    : endTime.getTime()-this.startTime.getTime()
            });

            if(typeof(parameters) != "undefined" && typeof(recipients) != "undefined"){
                var users = [];
                if(typeof(recipients) != "undefined"){
                    users = recipients;
                }

                var params = {};
                if(typeof(parameters) != "undefined"){
                    params = parameters;
                }

                socketiomanagercallbacksuccess(request, params, users);
            }
        },
        error      : function(message, error){
            status = 500;

            if(typeof(message) == "string"){
                var errorCode = message;
                if(typeof(error) != "undefined"){
                    errorCode = error;
                }
                message = JSON.stringify({
                    error   : errorCode,
                    message : message
                });
            }else if(typeof(message) != "undefined" &&
                    message !== null){
                message = JSON.stringify(message);
            }else{
                message = "{}";
            }

            this.res.emit(this.channel, {
                status     : status,
                message    : message,
                identifier : this.identifier
            });
        },
        progress: function(progress, message){
            if(typeof(progress) == "undefined"){
                if(this.stepsDone+1 <= this.totalSteps){
                    this.stepsDone++;
                }
            }else{
                if(progress > this.totalSteps){
                    this.totalSteps = progress;
                }
            }

            this.stepsDone = progress;
            this.success(message, 206); // Partial transfer
        },
        log: function(message){
            status = 100;

            message = JSON.stringify({
                log: message
            });

            this.res.emit(this.channel, {
                status           : status,
                message          : message,
                identifier       : this.identifier,
                room             : this.room,
                uniqueRequestID  : this.id,
            });
        }
    };

    // Check if all the required parameters are provided
    var missingParameters = [];
    var wrongTypeParameters = [];
    var providedParameters = request.params;

    _.each(expectedParameters, function(row){
        if(!providedParameters.hasOwnProperty(row.name)){
            missingParameters.push(row);
        }else if (row.type.indexOf(typeof(providedParameters[row.name])) == -1) {
            wrongTypeParameters.push(row);
        }
    });

    if(missingParameters.length){
        console.log("");
        console.log("[function]"+req.room.yellow);
        console.log("<<< Parameters Missing >>>");
        _.each(missingParameters, function(row){
            console.log("[" + colors.yellow(row.type) + "]"+row.name.cyan);
        });
    }

    if(wrongTypeParameters.length){
        console.log("");
        console.log("[function]"+req.room);
        console.log("<<< Parameters Wrong Type >>>");
        _.each(wrongTypeParameters, function(row){
            console.log("Expected: [" + colors.yellow(row.type) + "]" + row.name.cyan + " - Provided: [" + colors.yellow(typeof(providedParameters[row.name])) + "]" + row.name.cyan);
        });
    }

    if(missingParameters.length){
        console.log("<<< Parameters provided >>>");
        _.each(Object.keys(providedParameters), function(key){
            var value = request.params[key];
            console.log("[" + colors.yellow(typeof(value)) + "]" + key.cyan + " - " + value.blue);
        });
        console.log("");
    }

    // Trigger the cloud function
    callback(request, response);
};
