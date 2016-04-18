var path      = require('path');
var jssha     = require(path.normalize(__dirname + '/jssha256.js'));
var redis     = require('redis').createClient;
var itcm      = require('intercom-client');
var intercom  = new itcm.Client(intercomCredentials());

exports.LIMIT_REQUESTS_FREE_PLAN = 10000;
exports.SHOULD_USE_SLL = false;

// Put yur Own developer API key from Synchronise. This is your public key as a customer of Synchronise.
// If you created your own instance of Synchronise, this public key should be the one of the first user created on your instance (the admin)
exports.SYNCHRONISEAPIKEY = "";

/***** Mailgun *****/
// This is used to send emails from Synchronise
exports.mailgun = function(){
	return {
		key: '',
        sender: ''
	};
};

/***** STRIPE *****/
// This is used to process credit cards on the platform.
// Not required if you only use Synchronise for yourself
exports.stripe_secret_key = function(){
	if(process.env.AWS){ // PRODUCTION
		return "";
	}else{ // DEVELOPMENT
		return "";
	}
};

/***** AWS *****/
// Used to communicate with your own AWS account
exports.AWSCredentials = {
	accessKeyId: "",
	secretAccessKey: ""
};

/***** INTERCOM *****/
// This is used to communicated with customers from the server
// Not required if you only use Synchronise for yourself
function intercomCredentials(){
	if(process.env.AWS){ // PRODUCTION
		return { appId: '', appApiKey: '' };
	}else{ // DEVELOPMENT
		return { appId: '', appApiKey: '' };
	}
}

// Your API Secret for Intercom
exports.intercom_api_secret = "-R4ejO3nZtHoYxnc0k";
exports.intercom            = intercom;

exports.intercomTrackEvent  = function(event_name, user_id){
	var time = Math.round(new Date().getTime()/1000);
	intercom.events.create({
		event_name: event_name,
		created_at: time,
		user_id: user_id
	});
};

/***** SOCIAL APP KEYS *****/
// This is used to configure the OAuth communications with the different services
// Not required if you do not want to use social logins
exports.facebookCredentials = function(){
	if(process.env.AWS){ // PRODUCTION
		return {
			app_id: "",
			app_secret: "",
			accessTokenForDebug: "",
			callbackURL: "https://yoururl.com/auth/facebook/callback"
		};
	}else{ // DEVELOPMENT
		return {
			app_id: "",
			app_secret: "",
			accessTokenForDebug: "",
			callbackURL: "http://localhost:3001/auth/facebook/callback"
		};
	}
};

exports.githubCredentials = function(){
	if(process.env.AWS){ // PRODUCTION
		return {
			app_id: "",
			app_secret: "",
			callbackURL: "https://yoururl.com/auth/github/callback"
		};
	}else{ // DEVELOPMENT
		return {
			app_id: "",
			app_secret: "",
			callbackURL: "http://localhost:3001/auth/github/callback"
		};
	}
};

exports.bitbucketCredentials = function(){
	if(process.env.AWS){ // PRODUCTION
		return {
			app_id: "",
			app_secret: "",
			callbackURL: "https://yoururl.com/auth/bitbucket/callback"
		};
	}else{
		return {
			app_id: "",
			app_secret: "",
			callbackURL: "http://localhost:3001/auth/bitbucket/callback"
		};
	}
};

exports.googleCredentials = function(){
	if(process.env.AWS){ // PRODUCTION
		return {
			app_id: "",
			app_secret: "",
			callbackURL: "https://yoururl.com/auth/google/callback"
		};
	}else{
		return {
			app_id: "",
			app_secret: "",
			callbackURL: "http://localhost:3001/auth/google/callback"
		};
	}
};

/***** DATABASE *****/
// These are the credentials to connect to the databases
// PRODUCTION DATABASE
if(process.env.AWS){
	var rcEvents = {
		host       : "",
		port       : '',
		pass       : "",
		disableTTL : true,
		secret     : ""
	};

	var rcSession = {
		host       : "",
		port       : '',
		pass       : "",
		disableTTL : true,
		secret     : ''
	};

	var rcData = {
		host       : "",
		port       : '',
		pass       : "",
		disableTTL : true,
		secret     : ''
	};
}else{
// DEVELOPMENT DATABASE
	var rcEvents = {
		host       : "",
		port       : '',
		pass       : "",
		disableTTL : true,
		secret     : ""
	};

	var rcSession = {
		host       : "",
		port       : '',
		pass       : "",
		disableTTL : true,
		secret     : ""
	};

	var rcData = {
		host       : "",
		port       : '',
		pass       : "",
		disableTTL : true,
		secret     : ""
	};
}

var publishRedisAdapter    = redis(rcEvents.port, rcEvents.host, { return_buffers: false, auth_pass: rcEvents.pass });
	publishRedisAdapter.on("error", function(error){
		console.log("Error SubscriberRedisAdapter : " + error);
	});

var subscriberRedisAdapter = redis(rcEvents.port, rcEvents.host, { detect_buffers: false, return_buffers: false, auth_pass: rcEvents.pass });
	subscriberRedisAdapter.on("error", function(error){
		console.log("Error SubscriberRedisAdapter : " + error);
	});
	subscriberRedisAdapter.subscribe("any");

var redisDataStore = redis(rcData.port, rcData.host, { detect_buffers: true, auth_pass: rcData.pass });
	redisDataStore.on("error", function(error){
		console.log("Error RedisDataStore : " + error);
	});

// Caching system for publish commands
exports.publishRedisAdapter = function(){
	publishRedisAdapter.pub = function(channel, message){
		return new Promise(function(resolve, reject){
			publishRedisAdapter.publish("any", JSON.stringify({
				channel: channel,
				message: message
			}));
			resolve();
		});
	};
	return publishRedisAdapter;
};

var subscribers = {};
exports.subscribers = subscribers;
exports.subscriberRedisAdapter = function(){
	subscriberRedisAdapter.on("message", function(any, data, other){
		var listOfSocketIdPinged = Array(); // Avoid multiple pongs of the result, the client will handle propagation already
		_.each(Object.keys(subscribers), function(key){
			var item = subscribers[key];
			if(typeof(item) != "undefined"){
				if(typeof(item.callback) != "undefined"){
					if(listOfSocketIdPinged.indexOf(item.id_socket) == -1){
						item.callback(data, function(id_socket){
							if(id_socket){
								listOfSocketIdPinged.push(id_socket);
							}
						});
					}
				}
			}
		});
	});

	subscriberRedisAdapter.sub = function(channelGiven, uniqueRequestID, id_socket, callback){
		subscribers[uniqueRequestID] = {
			id_socket: id_socket,
			timestamp: new Date(),
			callback: function(dataGiven, wasSuitable){
				var data = JSON.parse(dataGiven.toString(dataGiven));
				var channel = data.channel;
				var message = data.message;

				if(channelGiven == channel){
					callback(message);
					wasSuitable(this.id_socket);
				}else{
					wasSuitable(false);
				}
			}
		};
	};

	subscriberRedisAdapter.unsub = function(uniqueRequestID){
		delete subscribers[uniqueRequestID];
	};

	return subscriberRedisAdapter;
};

var redisSessionStore      = redis(rcSession.port, rcSession.host, { auth_pass: rcSession.pass });
	redisSessionStore.on("error", function (error) {
	    console.log("Error RedisSessionStore : " + error);
	});

exports.redisSessionStore            = redisSessionStore;
exports.redisSessionStoreCredentials = rcSession;
exports.redisDataStore               = redisDataStore;
exports.redisDataStoreCredentials    = rcData;

/***** NAVBAR *****/
global.navbarButtonsState = {
					      	home: '',
					        features: '',
					        docs: '',
					        about: '',
					        dashboard: '',
					        query: '',
					        chartform: '',
					        database: '',
					        analytics: '',
					        subdashboard: '',
					        api: '',
							superadmin: '',
							component: '',
							workflow: '',
							tokens: '',
							events: '',
							project: ''
					     };

exports.navbarButtonsState = global.navbarButtonsState;

exports.navbarButtonsStateReset = function() {
	var keys = Object.keys(global.navbarButtonsState);

	for(var i = 0; i < keys.length; i++){
		global.navbarButtonsState[keys[i]] = '';
	}
};

/***** OTHER STUFF *****/
exports.validateEmail = function(email){
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
};

exports.randomString = function(size){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < size; i++ )
	text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
};

exports.mergeObjectsProperties = function(){
	var ret = {};
	var len = arguments.length;
	for (var i=0; i<len; i++) {
		for (var p in arguments[i]) {
			if (arguments[i].hasOwnProperty(p)) {
				ret[p] = arguments[i][p];
			}
		}
	}
	return ret;
};

exports.nativeToSIODataType = function(nativeType){
	// MAJOR SIO TYPES : string, number, date, boolean, data, unknown

	if(typeof(nativeType) != "undefined"){
		switch(nativeType.toLowerCase()){
			case 'text':
			case 'memo':
			case 'hyperlink':
			case 'char':
			case 'varchar':
			case 'tinytext':
			case 'mediumtext':
			case 'longtext':
			case 'nchar':
			case 'nvarchar':
			case 'ntext':
				return 'string'; // STRING

			case 'byte':
			case 'integer':
			case 'long':
			case 'single':
			case 'double':
			case 'currency':
			case 'autonumber':
			case 'tinyint':
			case 'smallint':
			case 'mediumint':
			case 'int':
			case 'bigint':
			case 'float':
			case 'double':
			case 'decimal':
			case 'numeric':
			case 'smallmoney':
			case 'money':
			case 'real':
				return 'number'; // NUMBER

			case 'date/time':
			case 'date':
			case 'datetime':
			case 'datetime2':
			case 'datetimeoffset':
			case 'smalldatetime':
			case 'timestamp':
			case 'time':
			case 'year':
				return 'date'; // DATE

			case 'yes/no':
			case 'bit':
				return 'boolean'; // BOOLEAN

			case 'ole object':
			case 'blob':
			case 'mediumblob':
			case 'longblob':
			case 'binary':
			case 'varbinary':
			case 'image':
			case 'sql_variant':
			case 'uniqueidentifier':
			case 'xml':
				return 'data'; // DATA

			default:
				return 'unknown';
		}
	}else{
		return 'unknown';
	}
};

exports.defaultRuleForFieldType = function(fieldType){
	switch(fieldType){
	case 'boolean':
		return "true";

	case 'unknown':
		return "unknown";

	case 'data':
		return "data";

	case 'date':
		return "before";

	case 'number':
		return "equals";

	case 'string':
		return "equals";
	}
};

exports.isJson = function(str) {
    try { JSON.parse(str); } catch (e) { return false; } return true;
}
