var path              = require('path');
var jssha             = require(path.normalize(__dirname + '/jssha256.js'));
var redis             = require('redis');
var redisCreateClient = redis.createClient;
var itcm              = require('intercom-client');
var Mailgun           = require('mailgun-send');

exports.LIMIT_REQUESTS_FREE_PLAN = process.env.FREE_PLAN_LIMIT? process.env.FREE_PLAN_LIMIT : 10000;
exports.SHOULD_USE_SLL = process.env.SHOULD_USE_SLL? process.env.SHOULD_USE_SLL : false;

// Put yur Own developer API key from Synchronise. This is your public key as a customer of Synchronise.
// If you created your own instance of Synchronise, this public key should be the one of the first user created on your instance (the admin)
exports.SYNCHRONISEAPIKEY = process.env.SYNCHRONISEAPIKEY? process.env.SYNCHRONISEAPIKEY : "";

/***** Mailgun *****/
// This is used to send emails from Synchronise
exports.mailgun = function(){
	if(process.env.PRODUCTION){
		if(process.env.MAILGUN_KEY && process.env.MAILGUN_SENDER){
			Mailgun.config({
				key: process.env.MAILGUN_KEY,
				sender: process.env.MAILGUN_SENDER
			});
			return Mailgun;
		}else{
			return null;
		}
	}else{
		if(process.env.MAILGUN_KEY_DEV && process.env.MAILGUN_SENDER_DEV){
			Mailgun.config({
				key: process.env.MAILGUN_KEY_DEV,
				sender: process.env.MAILGUN_SENDER_DEV
			});
			return Mailgun;
		}else{
			return null;
		}
	}
};

/***** STRIPE *****/
// This is used to process credit cards on the platform.
// Not required if you only use Synchronise for yourself
exports.stripe_secret_key = function(){
	if(process.env.PRODUCTION){ // PRODUCTION
		return process.env.STRIPE_SECRET_KEY;
	}else{ // DEVELOPMENT
		return process.env.STRIPE_SECRET_KEY_DEV;
	}
};

/***** AWS *****/
// Used to communicate with your own AWS account
exports.AWSCredentials = {
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWE_SECRET_ACCESS_KEY
};

/***** INTERCOM *****/
// This is used to communicated with customers from the server
// Not required if you only use Synchronise for yourself
function intercomCredentials(){
	if(process.env.PRODUCTION){ // PRODUCTION
		return { appId: process.env.INTERCOM_APP_ID, appApiKey: process.env.INTERCOM_API_KEY };
	}else{ // DEVELOPMENT
		return { appId: process.env.INTERCOM_APP_ID_DEV, appApiKey: process.env.INTERCOM_API_KEY_DEV };
	}
}

if(intercomCredentials().appId && intercomCredentials().appApiKey){
	var intercom  = new itcm.Client(intercomCredentials());
}

// Your API Secret for Intercom
exports.intercom_api_secret = "-R4ejO3nZtHoYxnc0k";
exports.intercom            = intercom;

exports.intercomTrackEvent  = function(event_name, user_id){
	if(intercom){
		var time = Math.round(new Date().getTime()/1000);
		intercom.events.create({
			event_name: event_name,
			created_at: time,
			user_id: user_id
		});
	}
};

/***** SOCIAL APP KEYS *****/
// This is used to configure the OAuth communications with the different services
// Not required if you do not want to use social logins
exports.facebookCredentials = function(){
	if(process.env.PRODUCTION){ // PRODUCTION
		return {
			app_id: process.env.FACEBOOK_APP_ID,
			app_secret: process.env.FACEBOOK_APP_SECRET,
			accessTokenForDebug: process.env.FACEBOOK_ACCESS_TOKEN_FOR_DEBUG,
			callbackURL: process.env.FACEBOOK_CALLBACK_URL
		};
	}else{ // DEVELOPMENT
		return {
			app_id: process.env.FACEBOOK_APP_ID_DEV,
			app_secret: process.env.FACEBOOK_APP_SECRET_DEV,
			accessTokenForDebug: process.env.FACEBOOK_ACCESS_TOKEN_FOR_DEBUG_DEV,
			callbackURL: process.env.FACEBOOK_CALLBACK_URL_DEV
		};
	}
};

exports.githubCredentials = function(){
	if(process.env.PRODUCTION){ // PRODUCTION
		return {
			app_id: process.env.GITHUB_APP_ID,
			app_secret: process.env.GITHUB_APP_SECRET,
			callbackURL: process.env.GITHUB_CALLBACK_URL
		};
	}else{ // DEVELOPMENT
		return {
			app_id: process.env.GITHUB_APP_ID_DEV,
			app_secret: process.env.GITHUB_APP_SECRET_DEV,
			callbackURL: process.env.GITHUB_CALLBACK_URL_DEV
		};
	}
};

exports.bitbucketCredentials = function(){
	if(process.env.PRODUCTION){ // PRODUCTION
		return {
			app_id: process.env.BITBUCKET_APP_ID,
			app_secret: process.env.BITBUCKET_APP_SECRET,
			callbackURL: process.env.BITBUCKET_CALLBACK_URL
		};
	}else{
		return {
			app_id: process.env.BITBUCKET_APP_ID_DEV,
			app_secret: process.env.BITBUCKET_APP_SECRET_DEV,
			callbackURL: process.env.BITBUCKET_CALLBACK_URL_DEV
		};
	}
};

exports.googleCredentials = function(){
	if(process.env.PRODUCTION){ // PRODUCTION
		return {
			app_id: process.env.GOOGLE_APP_ID,
			app_secret: process.env.GOOGLE_APP_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL
		};
	}else{
		return {
			app_id: process.env.GOOGLE_APP_ID_DEV,
			app_secret: process.env.GOOGLE_APP_SECRET_DEV,
			callbackURL: process.env.GOOGLE_CALLBACK_URL_DEV
		};
	}
};

/***** DATABASE *****/
// These are the credentials to connect to the databases
// PRODUCTION DATABASE
if(process.env.PRODUCTION){
	var rcEvents = {
		host       : process.env.REDIS_EVENTS_HOST,
		port       : process.env.REDIS_EVENTS_PORT,
		pass       : process.env.REDIS_EVENTS_PASS,
		disableTTL : true,
		secret     : process.env.REDIS_EVENTS_SECRET
	};

	var rcSession = {
		host       : process.env.REDIS_SESSION_HOST,
		port       : process.env.REDIS_SESSION_PORT,
		pass       : process.env.REDIS_SESSION_PASS,
		disableTTL : true,
		secret     : process.env.REDIS_SESSION_SECRET
	};

	var rcData = {
		host       : process.env.REDIS_DATA_DATA,
		port       : process.env.REDIS_DATA_PORT,
		pass       : process.env.REDIS_DATA_PASS,
		disableTTL : true,
		secret     : process.env.REDIS_DATA_SECRET
	};
}else{
	// DEVELOPMENT DATABASE
	var rcEvents = {
		host       : process.env.REDIS_EVENTS_HOST_DEV,
		port       : process.env.REDIS_EVENTS_PORT_DEV,
		pass       : process.env.REDIS_EVENTS_PASS_DEV,
		disableTTL : true,
		secret     : process.env.REDIS_EVENTS_SECRET_DEV
	};

	var rcSession = {
		host       : process.env.REDIS_SESSION_HOST_DEV,
		port       : process.env.REDIS_SESSION_PORT_DEV,
		pass       : process.env.REDIS_SESSION_PASS_DEV,
		disableTTL : true,
		secret     : process.env.REDIS_SESSION_SECRET_DEV
	};

	var rcData = {
		host       : process.env.REDIS_DATA_DATA_DEV,
		port       : process.env.REDIS_DATA_PORT_DEV,
		pass       : process.env.REDIS_DATA_PASS_DEV,
		disableTTL : true,
		secret     : process.env.REDIS_DATA_SECRET_DEV
	};
}

// We are running on heroku servers
if(process.env.NODE && ~process.env.NODE.indexOf("heroku")){
	var redisURLS = [];
	for (var i = 0; i < Object.keys(process.env).length; i++) {
		var row = process.env[Object.keys(process.env)[i]];
		if(row.indexOf("redis") != -1){
			redisURLS.push(row);
		}
	}

	var publishRedisAdapter    = redis.createClient(redisURLS[0]);
	var subscriberRedisAdapter = redis.createClient(redisURLS[1]);
	var redisDataStore         = redis.createClient(redisURLS[2]);
}else{
	var publishRedisAdapter    = redisCreateClient(rcEvents.port, rcEvents.host, { return_buffers: false, auth_pass: rcEvents.pass });
	var subscriberRedisAdapter = redisCreateClient(rcEvents.port, rcEvents.host, { detect_buffers: false, return_buffers: false, auth_pass: rcEvents.pass });
	var redisDataStore         = redisCreateClient(rcData.port, rcData.host, { detect_buffers: true, auth_pass: rcData.pass });
}

publishRedisAdapter.on("error", function(error){
	console.log("Error SubscriberRedisAdapter : " + error);
});

subscriberRedisAdapter.on("error", function(error){
	console.log("Error SubscriberRedisAdapter : " + error);
});
subscriberRedisAdapter.subscribe("any");

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
