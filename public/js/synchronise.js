var Synchronise;

dependenciesLoader(["io", "$", "_", "Persist"], function(){
    Synchronise = (function(){
        function paramsToStringOrderedAlphabetically(params, ignore) {
            var fieldsToIgnore = Array();
            if(typeof(ignore) != "undefined"){
                if(Array.isArray(ignore)){
                    fieldsToIgnore = ignore;
                }else{
                    fieldsToIgnore = [ignore];
                }
            }

            var fieldsFiltered = _.filter(Object.keys(params), function(key){
                return (fieldsToIgnore.indexOf(key) == -1);
            });

            var orderedList = _.sortBy(fieldsFiltered, function(key){
                return key;
            });

            var string = "";
            _.each(orderedList, function(item){
                if(item != "realtime"){ // Escape the realtime paramater
                    if(typeof(params[item]) == "object"){
                        string+=item+JSON.stringify(params[item]);
                    }else{
                        string+=item+params[item];
                    }
                }
            });

            return string;
        }

        var CallbackSignature = function(functionName, params, realtime){
            this.shouldCache  = false;
            this.functionName = functionName;
            this.params       = params;
            this.firstCalled  = false;
            this.realtime     = realtime;
            this.callbacks    = {};
            this.identifier   = functionName + paramsToStringOrderedAlphabetically(params, realtime.ignore);
            this.timestamp    = new Date();
            this.callbacks    = {};
        };

        // Persistant storage for user sessions
        var persistantStorage = new Persist.Store('siowebinterface', {
            defer: false
        });

        var api;

        var host = window.location.host;
        /*if (host.indexOf("localhost") == -1) {
            host = "websocket.synchronise.io";
        }*/
        api = host;

        var socket = io.connect(host, {
                reconnect: false,
                'try multiple transports': false,
                transports: ["websocket", "flashsocket", "htmlfile", "xhr-polling", "jsonp-polling", "polling"],
                path: "/socket.io"
            });
        var intervalID;
        var reconnectCount = 0;

        // Contains the callbacks
        // Structure :
        // |> Channel (Ex : Cloud.run)
        // |---------> Identifier (Ex : functionNameParam1ValueParam1, parameters orderered alphabetically and stringified)
        // |---------------------> functionName
        // |---------------------> params
        // |---------------------> callbacks
        // |---------------------> firstCalled (boolean[Default: false] : whether the callbacks have been fired already once)
        // |---------------------> realtime (boolean : if false it does not fire the events on the second call)
        var callbacks = {};

        // Keeps track of all the requests
        var requests  = {};
        var isConnected = false;

        socket.on('connect', function(socketClient){
            isConnected = true;

            _.each(connectionStatusCallbacks, function(callback){
                if(typeof(callback.connected) != "undefined"){
                    callback.connected();
                }
            });
        });

        // Register the list of callbacks that will be triggered on the connection events
        var connectionStatusCallbacks = Array(); // Calls those callbacks with the connections events

        var tryingToReconnect = false;
        socket.on('disconnect', function () {
            isConnected = false;
            if(!tryingToReconnect){
                tryReconnect();
            }
        });

        // Ping the server every 500ms to maintain connection
        window.setInterval(function(){
            if(isConnected){
                socket.emit("dummy", "");
            }
        }, 500);

        var tryReconnect = function () {
            $.ajax('/')
             .success(function () {
                tryingToReconnect = false;
                socket.io.reconnect();
            }).error(function (err) {
                _.each(connectionStatusCallbacks, function(callback){
                    if(typeof(callback.lost) != "undefined"){
                        callback.lost(err);
                    }
                });
                window.setTimeout(function(){
                    tryReconnect();
                }, 500);
            });
        };

        socket.on('Cloud.run', function(result){
            if(callbacks.hasOwnProperty('Cloud.run')){
                // Contains list of callbacks
                var callbackList = callbacks['Cloud.run'][result.identifier];

                _.each(Object.keys(callbackList), function(currentKey){
                    var callback = callbackList[currentKey];

                    var shouldFire = false;
                    // firstCalled means "has been called once already",
                    // so in our case !callback.firstCalled means "has never been called"

                    if(!callback.firstCalled && !callback.shouldAbort){ // This is the first call of the callbacks
                        shouldFire = true;
                    }else{
                        // We already fired the callbacks but we accept realtime updates
                        if((callback.identity.realtime && !callback.shouldAbort) || result.status == 100){
                            shouldFire = true;
                        }
                    }

                    // Reset the "shouldAbort" setting because once it has been called we can set it again after execution
                    callbacks['Cloud.run'][result.identifier][currentKey].shouldAbort = false;

                    // We have the right to fire the callbacks
                    if(shouldFire){
                        // Keep track of the calls
                        callbacks['Cloud.run'][result.identifier][currentKey].stepsDone  = result.stepsDone;
                        callbacks['Cloud.run'][result.identifier][currentKey].totalSteps = result.steps;

                        callbacks['Cloud.run'][result.identifier][currentKey].identity.progress = {
                            percentage : Math.round((result.stepsDone/result.steps)*100),
                            totalSteps  : result.steps,
                            currentStep : result.stepsDone
                        };

                        // Result is not a progress of the current request
                        // If it was a progress we ignore all of the rest and return only the progress
                        if(result.status != 206){
                            callbacks['Cloud.run'][result.identifier][currentKey].identity.amountOfCalls = callbacks['Cloud.run'][result.identifier][currentKey].identity.amountOfCalls+1;

                            // Current request temporary storage for timing
                            var reqTempStore = requests['Cloud.run'];
                                reqTempStore = reqTempStore[result.identifier];
                                reqTempStore = reqTempStore[currentKey];

                            if(typeof(reqTempStore) !== "undefined"){
                                if(reqTempStore.hasOwnProperty(result.uniqueRealtimeID)){
                                    reqTempStore = reqTempStore[result.uniqueRealtimeID];
                                }
                            }

                            if(reqTempStore){
                                reqTempStore.endCommunication  = new Date();
                                reqTempStore.executionTime     = result.executionTime;
                                reqTempStore.communicationTime = reqTempStore.endCommunication.getTime()-reqTempStore.startCommunication;

                                callbacks['Cloud.run'][result.identifier][currentKey].identity.executions.push({
                                    measurement       : "milliseconds",
                                    communicationTime : reqTempStore.communicationTime,
                                    executionTime     : reqTempStore.executionTime
                                });

                                var listOfPreviousExecutions = callbacks['Cloud.run'][result.identifier][currentKey].identity.executions;

                                callbacks['Cloud.run'][result.identifier][currentKey].identity.lastRequest  = listOfPreviousExecutions[listOfPreviousExecutions.length-1];
                                callbacks['Cloud.run'][result.identifier][currentKey].identity.firstRequest = listOfPreviousExecutions[0];
                                callbacks['Cloud.run'][result.identifier][currentKey].identity.allRequests  = listOfPreviousExecutions;

                                callbacks['Cloud.run'][result.identifier][currentKey].identity.longestRequest = _.max(listOfPreviousExecutions, function(item){
                                    return item.executionTime+item.communicationTime;
                                });

                                callbacks['Cloud.run'][result.identifier][currentKey].identity.shortestRequest = _.min(listOfPreviousExecutions, function(item){
                                    return item.executionTime+item.communicationTime;
                                });

                                callbacks['Cloud.run'][result.identifier][currentKey].identity.averageRequestTime = _.reduce(listOfPreviousExecutions, function(previousSum, item){
                                    return previousSum+item.executionTime+item.communicationTime;
                                }, 0) / (listOfPreviousExecutions === 0 ? 1 : listOfPreviousExecutions.length);
                            }
                        }

                        if(result.status == 200){
                            callbackList[currentKey].firstCalled = true;
                            if(typeof(callback.callbacks.success) != "undefined"){
                                var message = JSON.parse(result.message);

                                if(callback.shouldCache){
                                    var value = persistantStorage.get("cacheData");
                                    if(!value){
                                        value = "{}";
                                    }
                                    var data  = JSON.parse(value);
                                        data[callback.identifier] = {
                                            data      : message,
                                            type      : typeof(message),
                                            timestamp : new Date().getTime()
                                        };

                                    persistantStorage.set('cacheData', JSON.stringify(data));
                                }
                                callback.callbacks.success(message);
                            }
                        }

                        if(result.status == 500){
                            callbackList[currentKey].firstCalled = true;
                            if(typeof(callback.callbacks.error) != "undefined"){
                                callback.callbacks.error(JSON.parse(result.message));
                            }
                        }

                        if(typeof(callback.callbacks.progress) != "undefined"){
                            if(result.status == 206){
                                callback.callbacks.progress(callbacks['Cloud.run'][result.identifier][currentKey].identity.progress, JSON.parse(result.message));
                            }
                        }

                        if(result.status == 100){
                            if(typeof(callback.callbacks.log) != "undefined"){
                                if(callback.uniqueRequestID == result.uniqueRequestID){
                                    callback.callbacks.log(JSON.parse(result.message).log);
                                }
                            }
                        }

                        // If request is not a progress ping
                        if(typeof(callback.callbacks.always) != "undefined" && // Callback defined
                           result.status != 206 && // Progress
                           result.status != 100){ // Log
                            callbacks['Cloud.run'][result.identifier][currentKey].identity.hasFinished = true;
                            callback.callbacks.always();
                        }
                    }
                });
            }
        });

        socket.on('Cloud.dataUpdate', function(result){
            var channel    = result.channel;
            var identifier = result.identifier;

            if(callbacks.hasOwnProperty("Cloud.run")){
              if(callbacks["Cloud.run"].hasOwnProperty(identifier)){
                    // We only need the first one because the params are the same
                    // Only the callbacks are different but they will be dispatched automatically when pong received
                    var item = callbacks[channel][identifier][Object.keys(callbacks[channel][identifier])[0]];
                        item.params.realtime = false; // We avoid resubscribing the callback

                    sendRequest({
                        channel         : channel,
                        uniqueRequestID : item.uniqueRequestID,
                        data            : {
                            params     : item.params,
                            room       : item.functionName,
                            identifier : identifier
                        }
                    });
              }
            }
        });

        // The function that we have tried to call requires a password
        socket.on('Cloud.requiresPassword', function(result){
            var data = JSON.parse(result.message);

            modalMessage.getTempPassword(data.reason, function(password){
                var callbacksCopy = callbacks;
                var cbks = Array();

                if(typeof(callbacks) != "undefined"){
                    if(typeof(callbacks["Cloud.run"]) != "undefined"){
                        if(typeof(callbacks["Cloud.run"].hasOwnProperty(result.identifier)) != "undefined"){
                            cbks = callbacks["Cloud.run"][result.identifier];
                        }
                    }
                }

                if(password === false){ // Authentication aborted
                    _.each(cbks, function(row){
                        if(typeof(row.callbacks.abort) != "undefined"){
                            row.callbacks.abort("User authentication aborted");
                            row.callbacks.always();
                        }
                    });

                    sendRequest({
                        channel         : "Cloud.passwordAuthenticationAborted",
                        data            : {
                            params     : {
                                realtime: false
                            },
                            room       : "",
                            identifier : result.indentifier
                        }
                    });
                }else{ // A password has been given by the user
                    // Send the password to the remote
                    sendRequest({
                        channel    : "Cloud.passwordForAuthentication",
                        data       : {
                            params     : {
                                realtime: false,
                                password: password
                            },
                            room       : "",
                            identifier : result.identifier
                        }
                    });
                }
            }, true);
        });

        var sendRequest = function(request) {
            var intervalRequest = window.setInterval(function(){
                if(socket.connected){
                    window.clearInterval(intervalRequest);

                    var date = new Date();
                    var realtimeRequestID = request.data.identifier+date.getTime(); // ID of the current execution (not the actual request)

                    // Initialise analytics
                    if(request.channel == "Cloud.run"){
                        _.each(callbacks[request.channel][request.data.identifier], function(item){
                            var willFire = false;
                            if(!item.firstCalled){ // This is the first call of the callbacks
                                willFire = true;
                            }else{
                                // We already fired the callbacks but we accept realtime updates
                                if(item.realtime){
                                    willFire = true;
                                }
                            }

                            if(willFire){
                                if(typeof(requests[request.channel]) == "undefined"){
                                    requests[request.channel] = {};
                                }

                                if(typeof(requests[request.channel][request.data.identifier]) == "undefined"){
                                    requests[request.channel][request.data.identifier] = {};
                                }

                                if(typeof(requests[request.channel][request.data.identifier][item.uniqueRequestID]) == "undefined"){
                                    requests[request.channel][request.data.identifier][item.uniqueRequestID] = {};
                                }

                                requests[request.channel][request.data.identifier][item.uniqueRequestID][realtimeRequestID] = {
                                    startCommunication : new Date(),
                                    endCommunication   : undefined,
                                    executionTime      : undefined
                                };
                            }
                        });
                    }

                    socket.emit(request.channel, _.extend(request.data, {
                        realtimeRequestID : realtimeRequestID,
                        uniqueRequestID   : request.uniqueRequestID
                    }));
                }
            }, 1);
        };

        function resubscribeSocketToChannels(){
            var identifiers = Array();
            _.each(callbacks["Cloud.run"], function(item){
                var identifier = item.functionName+paramsToStringOrderedAlphabetically(item.params);
                identifiers.push(identifier);
            });
            Synchronise.Cloud.subscribeToChannel(identifier);
        }

        var public_key;
        var callbacksForFetchingUsers = [];

        return {
            debug: function(value){
                persistantStorage.set("debug", value);
                return value ? "Debug mode activated" : "Debug mode deactivated";
            },
            init: function(pk){
                public_key = pk;
            },
            Connection: {
                Lost: function(callback){
                    connectionStatusCallbacks.push({
                        lost: callback
                    });
                },
                Connected: function(callback){
                    connectionStatusCallbacks.push({
                        connected: callback
                    });
                }
            },
            LocalStorage:{
                public_key: public_key,
                get: function(key, callback, defaultValue, realtime, fromServer){
                    var value = persistantStorage.get(key);

                    if(typeof(value) != "undefined" && value !== null){
                        callback(JSON.parse(value).value);
                    }

                    var parameters = {};
                        parameters.key = key;

                        parameters.realtime = false;

                        if(typeof(realtime) != "undefined"){
                            if(typeof(realtime.ignore) != "undefined"){
                                if(Array.isArray(realtime.ignore)){
                                    parameters.realtime = {
                                        ignore: realtime.ignore.concat(["defaultValue"])
                                    };
                                }else{
                                    parameters.realtime = {
                                        ignore: [realtime.ignore, "defaultValue"]
                                    };
                                }
                            }else{
                                parameters.realtime = {
                                    ignore: "defaultValue"
                                };
                            }
                        }

                        if(typeof(defaultValue) != "undefined"){
                            parameters.defaultValue = defaultValue;
                        }

                    if(typeof(fromServer) == "undefined" || fromServer){
                        return Synchronise.Cloud.run("userSetting", parameters, {
                            success: function(data){
                                var result = data;
                                persistantStorage.set(key, JSON.stringify({value:result}));
                                callback(result);
                            },
                            error: function(err){
                                callback(err);
                            }
                        });
                    }
                },
                set: function(key, value, save){
                    persistantStorage.set(key, JSON.stringify({value:value}));

                    if(typeof(save) == "undefined" || save){
                        Synchronise.Cloud.run("userSettingSet", {key:key, value: value}, {});
                    }
                }
            },
            Cloud: {
                run: function(functionName, params, response){
                    var realtime = false;
                    if(typeof(params.realtime) != "undefined"){
                        realtime = params.realtime;
                        // Realtime messes-up with the generation of the unique identifier header of the function
                        // It is re-added later on bellow
                        delete params.realtime;
                    }

                    var channel = 'Cloud.run';

                    var hasCallbacks = true;

                    if(typeof(response) == "undefined"){
                        hasCallbacks = false;
                    }else{
                        if(typeof(response.success) == "undefined" &&
                           typeof(response.error) == "undefined" &&
                           typeof(response.abort) == "undefined"){
                               hasCallbacks = false;
                        }
                    }

                    // Answers the cache before the answer of the server
                    var cache = Boolean(params.cacheFirst);

                    delete params.cacheFirst;

                    var callbackSignature = new CallbackSignature(functionName, params, realtime);
                        callbackSignature.shouldCache = cache;

                    if(cache){
                        if(response){
                            if(response.hasOwnProperty('success')){
                                var value = persistantStorage.get("cacheData");
                                if(value){
                                    var data = JSON.parse(value)[callbackSignature.identifier];

                                    if(data){
                                        if(response.hasOwnProperty('always')){
                                            response.always();
                                        }
                                        response.success(data.data);
                                    }
                                }
                            }
                        }
                    }

                    if(!hasCallbacks && persistantStorage.get("debug") == "true"){
                        if(typeof(console.warn) != "undefined"){
                            console.warning("You did not declare a callback for the function '" + functionName + "'. Add the declaration like this : \nSynchronise.Cloud.run('" + functionName + "', {parameters ...}, {\n    success: function(data){\n    },\n    error: function(err){\n    },\n    abort: function(reason){\n    }\n});");
                        }else{
                            console.log("You did not declare a callback for the function '" + functionName + "'. Add the declaration like this : \nSynchronise.Cloud.run('" + functionName + "', {parameters ...}, {\n    success: function(data){\n    },\n    error: function(err){\n    },\n    abort: function(reason){\n    }\n});");
                        }
                    }

                    // Generate a uniqueID for the realtime subscribtion
                    var date = new Date().getTime().toString() + (Math.floor(Math.random() * (1000 - 1)) + 1);
                    var uniqueRequestID;

                    // We have been given an object
                    if((typeof realtime === "object") && (realtime !== null)){
                        if(typeof(realtime.ignore) != "undefined"){
                            uniqueRequestID = functionName+paramsToStringOrderedAlphabetically(params, realtime.ignore)+date;
                        }
                    }else{ // We have been given a boolean
                        uniqueRequestID = functionName+paramsToStringOrderedAlphabetically(params)+date;
                    }

                    callbackSignature.uniqueRequestID = uniqueRequestID;

                    // Contains the property and methods that are revealed to the dev
                    callbackSignature.identity = {
                        abort: function(){
                            this.shouldAbort = true;
                        },
                        setRealtime: function(realtime){
                            // We are not currently subscribed and we are asked to subscribe
                            if(!this.realtime && realtime){
                                this.realtime = true;
                                callbackSignature.params.realtime = true;

                                // We have to subscribe
                                sendRequest({
                                    channel    : channel,
                                    data       : {
                                        params        : callbackSignature.params,
                                        pk            : public_key,
                                        room          : callbackSignature.functionName,
                                        identifier    : callbackSignature.identifier,
                                        skipExecution : true,
                                        realtime      : true
                                    }
                                });
                            }

                            // We are currently subscribed and we are asked to unsubscribe
                            if(this.realtime && !realtime){
                                // We have to unsubscribe
                                sendRequest({
                                    channel    : "Cloud.unsubscribeRealtime",
                                    data       : {
                                        uniqueID   : this.uniqueRequestID
                                    }
                                });

                                this.realtime = false;
                            }
                        },
                        isRealtime : function(){
                            return this.realtime;
                        },
                        hasStarted : function(){
                            return this.hasStarted;
                        },
                        hasFailed : function(){
                            return this.failed;
                        },
                        hasSucceeded : function(){
                            return this.succeeded;
                        },
                        hasAborted : function(){
                            return this.aborted;
                        },
                        hasFinished: function(){
                            return this.finished;
                        },
                        run        : function(){
                            // Reset to default settings
                            this.failed = false;
                            this.succeeded = false;
                            this.aborted = false;
                            this.hasFinished = false;
                            this.hasStarted = true;

                            sendRequest({
                                channel         : channel,
                                uniqueRequestID : callbackSignature.uniqueRequestID,
                                data       : {
                                    realtime   : this.realtime,
                                    pk         : public_key,
                                    params     : callbackSignature.params,
                                    room       : callbackSignature.functionName,
                                    identifier : callbackSignature.identifier
                                }
                            });
                        },
                        amountOfCalls : 0, // Default calls made is 0
                        progress      : 0
                    };

                    callbackSignature.callbacks = {
                        success  : function(data){
                            callbackSignature.identity.succeeded = true;

                            if(typeof(response) != "undefined"){
                                if(typeof(response.success) != "undefined"){
                                    response.success(data);
                                }
                            }
                        },
                        error    : function(data){
                            callbackSignature.identity.failed = true;

                            if(typeof(response) != "undefined"){
                                if(typeof(response.error) != "undefined"){
                                    if(typeof(data) == "string"){
                                        response.error(JSON.parse(data));
                                    }else{
                                        response.error(data);
                                    }
                                }
                            }
                        },
                        always   : function(){
                            callbackSignature.identity.finished = true;

                            if(typeof(response) != "undefined"){
                                if(typeof(response.always) != "undefined"){
                                    response.always();
                                }
                            }
                        },
                        abort    : function(){
                            callbackSignature.identity.aborted = true;

                            if(typeof(response) != "undefined"){
                                if(typeof(response.abort) != "undefined"){
                                    response.abort();
                                }
                            }
                        },
                        progress : function(progress, message){
                            if(typeof(response) != "undefined"){
                                if(typeof(response.progress) != "undefined"){
                                    response.progress(progress, message);
                                }
                            }
                        },
                        log      : function(log){
                            if(typeof(response) != "undefined"){
                                if(typeof(response.log) != "undefined"){
                                    response.log(log);
                                }
                            }
                        }
                    };

                    if(persistantStorage.get("debug") == "true"){
                        callbackSignature.identity = _.extend(callbackSignature.identity, {
                            averageRequestTime : undefined,
                            longestRequest     : undefined,
                            shortestRequest    : undefined,
                            lastRequest        : undefined,
                            firstRequest       : undefined,
                            allRequests        : undefined
                        });
                    }

                    // Containes the states of the callback
                    var states = {
                        realtime          : realtime,
                        stepsDone         : 0,
                        totalSteps        : 1, // Default steps to do is 1
                        failed            : false,
                        succeeded         : false,
                        aborted           : false,
                        finished          : false,
                        started           : false,
                        executing         : false,
                        shouldAbort       : true,
                        executions        : Array(),
                        longestRequest    : undefined,
                        shortestRequest   : undefined,
                        uniqueRequestID   : callbackSignature.uniqueRequestID
                    };

                    // Set the current states of the callback
                    if(typeof(Object.defineProperty) != "undefined"){
                        _.each(Object.keys(states), function(key){
                            Object.defineProperty(callbackSignature.identity, key, {
                                enumerable: false,
                                writable: true
                            });

                            callbackSignature.identity[key] = states[key];
                        });
                    }else{
                        callbackSignature = _.extend(callbackSignature, states);
                    }

                    if(!callbacks.hasOwnProperty(channel)){
                        callbacks[channel] = {};
                    }

                    if(!callbacks[channel].hasOwnProperty(callbackSignature.identifier)){
                        callbacks[channel][callbackSignature.identifier] = {};
                    }

                    // Register the callback signature
                    callbacks[channel][callbackSignature.identifier][callbackSignature.uniqueRequestID] = callbackSignature;

                    return (function(){
                        callbacks[channel][callbackSignature.identifier][callbackSignature.uniqueRequestID].identity.run();
                        return callbacks[channel][callbackSignature.identifier][callbackSignature.uniqueRequestID].identity;
                    })();
                }
            },
            User: {
                current: function(){
                    var data = persistantStorage.get("user");
                    if(typeof(data) != "undefined" && data !== null){
                        if(data != "undefined" && data !== null){
                            data = JSON.parse(data);
                                data.isAdmin = function(){
                                    var isAdmin = false;
                                    _.each(data.roles, function(role){
                                        if(role.name == "admin"
                                        || role.name == "superadmin"
                                        || role.name == "docwriter"
                                        || role.name == "marketplace"
                                        || role.name == "marketplaceValidation"){
                                            isAdmin = true;
                                        }
                                    });
                                    return isAdmin;
                                };
                                return data;
                        }else{
                            return undefined;
                        }
                    }else{
                        return undefined;
                    }
                },
                auth_token: function(){
                    var data = persistantStorage.get("auth_token");

                    if(data){
                        return data;
                    }else{
                        return undefined;
                    }
                },
                fetchingCurrentUser : false,
                fetchCurrent: function(callback){
                    if(typeof(callback) != "undefined"){
                        callbacksForFetchingUsers.push(callback);
                    }

                    var _this = this;
                    if(!_this.fetchingCurrentUser){
                        _this.fetchingCurrentUser = true;
                        Synchronise.Cloud.run("getCurrentSession", {realtime: true, cacheFirst: true}, {
                            success: function(data){
                                if(data){
                                    persistantStorage.set("auth_token", data.session);
                                    persistantStorage.set("user", JSON.stringify(data.user));
                                    if(typeof(callback) != "undefined"){
                                        _.each(callbacksForFetchingUsers, function(callback){
                                            callback(data.user);
                                        });
                                    }
                                }else{
                                    persistantStorage.set("auth_token", undefined);
                                    persistantStorage.set("user", undefined);
                                    if(typeof(callback) != "undefined"){
                                        _.each(callbacksForFetchingUsers, function(callback){
                                            callback(false);
                                        });
                                    }
                                }
                            },
                            error: function(err){
                                console.log(err);
                            },
                            always: function(){
                                _this.fetchingCurrentUser = false;
                            }
                        });
                    }
                },
                logIn: function(email, password, response){
                    var paramsToSend = {email: email, password: password};
                    Synchronise.Cloud.run("login", paramsToSend, {
                        success: function(data){
                            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                                IdentityPoolId: 'us-east-1:1699ebc0-7900-4099-b910-2df94f52a030',
                                Logins: {
                                    'synchroniseio': data.authToken,
                                }
                            });

                            persistantStorage.set("auth_token", data.authToken);

                            var firstFetchUser = true;
                            Synchronise.Cloud.run("userObject", {user_id  : data.user_id,
                                                                 token    : data.authToken,
                                                                 realtime : true}, {
                                success: function(userObject){
                                    persistantStorage.set("user", JSON.stringify(userObject));

                                    if(typeof(response.success) != "undefined" && firstFetchUser){
                                        firstFetchUser = false;
                                        response.success(data);
                                    }
                                },
                                error: function(error){
                                    if(typeof(response.error) != "undefined"){
                                        response.error(error);
                                    }
                                }
                            });
                        },
                        error: function(error){
                            if(typeof(response.error) != "undefined"){
                                response.error(error);
                            }
                        },
                        always: function(){
                            if(typeof(response.always) != "undefined"){
                                response.always();
                            }
                        }
                    });
                },
                logOut: function(){
                    persistantStorage.set("auth_token", undefined);
                    persistantStorage.set("user", undefined);
                    persistantStorage.set('cacheData', JSON.stringify({}));
                }
            },
            Component: {
                run: function(idComponent, params, response){
                    return Synchronise.Cloud.run("executeComponent", _.extend(params, {id_component: idComponent}), response);
                }
            },
            File: {
                upload: function(files, folder, response){
                    var percentDone = 0;
                    var percentFiles = Array();
                    var filesDone = Array();

                    for(var i = 0; i < files.length; i++){
                        uploadFile(files[i], folder, response);
                    }

                    function uploadFile(currentFile, folder, response){
                        Synchronise.Cloud.run("uploadGetSignature", {folder: folder, file_type: currentFile.type}, {
                            success: function(signedResult){
                                var xhr = new XMLHttpRequest();
                                    xhr.open("PUT", signedResult.signed_request);

                                    // Compute the global progress of the upload
                                    xhr.addEventListener("progress", function(oEvent){
                                        var percentComplete = oEvent.loaded / oEvent.total;
                                        percentFiles[i] = percentComplete;

                                        percentDone = 0;
                                        for(var j = 0; j < files.length; j++){
                                            percentDone+= percentFiles[i];
                                        }

                                        if(typeof(response.progress) != "undefined"){
                                            response.progress(percentDone);
                                        }
                                    }, false);

                                    xhr.setRequestHeader('x-amz-acl', 'public-read');
                                    xhr.onload = function() {
                                        if (xhr.status === 200) {
                                            filesDone.push(signedResult);

                                            if(filesDone.length == files.length){
                                                response.success(filesDone);
                                            }

                                            if(typeof(response.always) != "undefined"){
                                                response.always();
                                            }
                                        }
                                    };

                                    xhr.onerror = function() {
                                    };

                                    xhr.send(currentFile);
                            },
                            error: function(error){
                                if(typeof(response.error) != "undefined"){
                                    response.error(error);
                                }

                                if(typeof(response.always) != "undefined"){
                                    response.always();
                                }
                            }
                        });
                    }

                    if(!files.length){
                        response.success([]);

                        if(typeof(response.always) != "undefined"){
                            response.always();
                        }
                    }
                }
            }
        };
    })();
});
