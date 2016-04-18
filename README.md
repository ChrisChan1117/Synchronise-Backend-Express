# [Synchronise](https://www.synchronise.io)
To get started, check out <https://www.synchronise.io>
![HomePage of Synchronise](https://images.synchronise.io/githubImage1.png)

## Table of contents
* [Quick start](#quick-start)
* [Introduction](#introduction)
* [Documentation](https://docs.synchronise.io)
* [Install and Run on your own server](#install-and-run-on-your-own-server)
* [Contribute](#contribute)

## Quick start
You do not need to install your own instance of Synchronise to use it. I advise that you experiment with the platform first. You can do so for FREE at [www.synchronise.io](https://www.synchronise.io). Once you are comfortable using it, you can come back anytime, and learn how to create your own instance of the Synchronise server.

## Introduction
Synchronise is an integration backend as a service created by [Thibaut Rey](https://www.twitter.com/thibautrey). It helps you connect web services to your app, without having to configure everything yourself or even maintain a server. It simplifies the integration process by standardising any APIs, and turning them into objects called "Components".
Components can be combined together in a "Workflow" to create more complex actions. Steps after steps you can create very powerful Workflows that will save you time and money.

Imagine a "Workflow" that "registers a user on your database", "send an email with mailgun" and "create a customer account on stripe", all that without having to write a single line of code.

The entire codebase is provided as is, under the MIT licence except the database containing sensitive data of existing customers. This means you are free to copy, modify and distribute Synchronise however you want. Software should be shared, and I am convinced the work the community will achieve, will always surpass my own dedication to this platform.

Here are the 3 features available so far:
![Components on Synchronise](https://images.synchronise.io/githubImage2.png)
![Workflows on Synchronise](https://images.synchronise.io/githubImage3.png)
![Custom Components on Synchronise](https://images.synchronise.io/githubImage4.png)

## Install and Run on your own server
### Fork it or Clone it
```shell
git clone https://github.com/synchroniseiorepo/server
```

### Install the databases
Synchronise needs 3 separate databases to avoid collissions.
First of all, create 3 new Redis databases. You can either do this locally by downloading [Redis](http://redis.io/download), or you could create a FREE account at [Redis Labs](https://redislabs.com/). Disclaimer: I am not affiliated with Redis Labs in anyway.

The 3 databases you need to create are:
- "data" Contains the actual data of Synchronise (users, components, projects...)
- "session" The session of the users
- "events" The events database is dedicated to the PubSub system for refreshing the web interface live.

Once you have done that, go to the file "/helpers/assets.js" and modify the settings accordingly using the credentials of your redis databases.

Look for the lines starting like this:
```javascript
/***** DATABASE *****/
// These are the credentials to connect to the databases
// PRODUCTION DATABASE
if(process.env.AWS){
	var rcEvents = {
```

And that's all you need to do. The system will automatically create and populate the different data stores without any other actions from your side.

### What about MySQL or Oracle?
To achieve the best efficiency I decided to build Synchronise entirely around Redis. I did not consider a second, the idea of MySQL because it did not make sense at the time.

Now, this does not mean you MUST use Redis to run Synchronise. You could use MySQL with just a few modifications of the code. The elements that you need to be modify are all contained in the file "helpers/assets.js".

The name of the file "assets" is not relevant I know that, but changing it now would require quite some work. If someone wants to modify it everywhere, feel free to rename it to something like "config.js" for example.

If you want to modify the databases system, look for a line starting like this in the file "helpers/assets.js":
```javascript
var publishRedisAdapter    = redis(rcEvents.port, rcEvents.host, { return_buffers: false, auth_pass: rcEvents.pass });
	publishRedisAdapter.on("error", function(error){
```
Then modify the adapters accordingly to your new architecture. Make sure your adapters responds to all the methods.

For example the publisher adapter needs a pub method:
```javascript
publishRedisAdapter.pub
```
If you have any difficulties adapting a new database system, give me a shout [@synchroniseio](https://www.twitter.com/synchroniseio) and I'll help you as fast as I can.

### Configure your server
There are some elements you need to setup before you can start using Synchronise server.

Go to the file "/helpers/assets.js" and modify the settings to your needs. They are all explained in the file so you should not have much difficulty understanding what they do. The settings you should modify are from the line:
```javascript
exports.LIMIT_REQUESTS_FREE_PLAN = 10000;
```
to the line
```javascript
	var rcData = {
		host       : "localhost",
		port       : '6379',
		pass       : "foobared",
		disableTTL : true,
		secret     : "foobared"
	};
}
```

All good? Now let's run your server!

### Run your server
The entry file for the server is located in the "bin" folder
```shell
node bin/www
```

Your server should now be running at

```
http://localhost:3001
````

Because this is the first time you run the server, there are no admin on the system. You MUST, create the first user using a MANUAL signin system. Basically, use email and password, not the social login. This first user you create will have all the permissions, including the superadmin panel.

All users after the first one, will have normal "user" permissions. You can modify the permissions of a user by going to the superadmin panel.

### Optional SSL
If you want to serve your server over SSL you will need to enable it in the file "helpers/assets.js".

Enable SSL:
```javascript
exports.SHOULD_USE_SLL = true;
```

You need to add 2 new files "certificate.pem" and "privatekey.pem" in the root folder of Synchronise so that it now looks like this:

...

[folder]views

[newFile]certificate.pem

[newFile]privatekey.pem

[file]package.json

...

## Deploy Synchronise on AWS
Deploying Synchronise on AWS takes a bit more work, but not too much I promise!

### Spring clean
The first thing to do is to get rid of all the modules that AWS does not like.

For some reasons, EC2 instances don't want to run if some NPM modules are provided. I think this is for security reasons, but we could not find any clear evidence of that. These packets are not mandatory for Synchronise to execute properly, so it is safe to remove them.

In the folder of Synchronise, execute the following command to remove all the modules AWS does not like:
```shell
npm remove oniguruma; npm remove fsevents; npm remove bufferutil; npm remove utf-8-validate;
```

Now that you have cleaned the folder, you need to consider whether you want to deploy on a single instance, or if you want to deploy on multiple instances for scalability purposes.

### Single Instance
Let's face it, Synchronise does not play well with Elastic Beanstalk, because it uses some custom configurations for the WebSockets.

However, I still recommend to create an EBS application because it simplifies the deployment process. You will use EBS for its deployment script, not for its scalability purpose.

Go and create a new app on AWS Elastic Beanstalk.

Now that this is done, go in the main folder of Synchronise and find the folder named ".aws". Inside it you will find a file called "credentials". Put your own AWS credentials there.

Note that you should also put your AWS credentials in the file "/helpers/assets.js" when you configure Synchronise.

Look for a line starting like this:
```javascript
exports.AWSCredentials = {
```

### Getting ready for deployment.
Configure your Elastic environment with:
```shell
eb init
```
Make sure your have commited all changes of Synchronise and execute
```shell
eb deploy your_application_name
```

Your application should be running now at the address given by AWS.

### Configuring deployed app
Almost there, one last step before it works properly. We need to tell Synchronise it is running in production mode.

In ElasticBeanstalk go to "Configuration" -> "Software Configuration" -> scroll down to "Environment Properties".

Add a new property with the name "AWS" and the value "true".

Apply your changes and wait for relaunch of your instance. Finger crossed, everything should work fine now.

### Multiple Instances
Coming soon...

## Contribute
### File structure
- backend      : Backend functions. In an MVC architecture this would be the Controller
- bin          : Setup of the app and scripting
- helpers      : Functions that are just doing one task, also contains the credentials of the software
- libraries    : Some NPM modules needed modifications to be compatible. We placed them here to avoid them being updated when we run NPM commands
- models       : Contains all the data models and their methods
- node_modules : Contains all the node modules
- public       : Contains all the files that will potentially be directly served to the browser at some point and that are available at the root of the website
    - css      : Contains all the CSS files of the website
    - js       : Contains all the Javascript files of the website
        - dependencies : Contains all the libraries that haven't been created by the Synchronise team
        - helpers      : Just helpers, there is one for manipulating the url for example
        - libraries    : Contains all the libraries created by the Synchronise team
    - fonts    : Contains all the fonts of the website
    - images   : Contains all the images of the website
    - js-react : Contains all the React.JS components in their uncompiled version. This folder has the same structure than the JS folder and all the content of js-react will be compiled and transferred to the JS folder when executing the required babel script
    - libs     : Contains all the versions of the Synchronise client library
- routes       : Contains all the routes of the website
- view         : Contains all the views of the website

### Realtime Interface Update
Hold tight, this one is challenging. It is not complicated, but confusing at first. Our constraints were speed, data footprint and memory footprint on the server.
This is not your usual Realtime PubSub because we wanted to ensure it is optimized for our case. We estimate you can run up to 2500 clients with a t2.micro instance on AWS.

If you have difficulty with understanding the realtime system, give us a shout @synchroniseio on Twitter.

When we created the platform we wanted to make sure the interface reacts to changes as it happens.
Synchronise comes with a built-in websocket, encapsulated in an object called Synchronise on the client side.
The Synchronise object comes with functions that simplify the work with the backend and the websocket.
Synchronise.Cloud.run()
Synchronise.User.current()
Synchronise.User.login()...

The idea is that the interface should refresh itself automatically when a change happen on the server.
Our realtime system works around a pub-sub architecture. The client code in Javascript subscribes to events happening on the server.

In this example
SC = Synchronise Library Client
S  = Server

- SC ------> S      When the page loads, the Client registers to the server and subscribes all functions for realtime
- SC <------ S      The Server provides a unique ID for the realtime session
- SC <------ S      When something happens on the data model, The server notifies all clients that are still connected, that en event happened for type of data X
- SC ------> S      Client says "I'm still alive, give me the updates for the type of data X"
SC <------ S      Server provides updated data to the client

This is very similar to Flux for React.JS. Flux wasn't mature enough when we first started Synchronise. We decided to create our own system.
The subscription is made at the function level, allowing to have a very small amount of functions needing to update every time.

Here is an example:
Let say we are displaying a list of user on the client using the function "getListUser". We want that function to be called every time a new user has signed up.

On the client side
The Javascript function is executed to collect the current users. That same function also subscribes to any changes happening with users by specifying the "realtime" parameter
Synchronise.Cloud.run("getListUsers", {realtime: true, sort: "name"...}, {
    success: function(users){
        // Display the users on the interface
    }
});

On the server side
Every time a new user signs up, let say in the function "createUser" of the backend "user", we call
response.success("userCreate yeah!", 200, {}, [idOfUsersConcernedByTheUpdate]);

The response.success function will calls all concerned clients, and tell them to ask for new data about the "getListUsers" function.

- "userCreate yeah!": This is any data we want to send back to the client. This has no impact on the realtime subscription
- 200: This is the status code of the execution. Because it is a success it is 200. It could be anything we want.
- {}: Contains data that are going to filter the realtime subscription. More on that later.
- [idOfUsersConcernedByTheUpdate]: The is an array of user ID that are concerned by the update. If we wanted all users to know about the update we would make a list of all registered users on the website. This is useful in order to only ping the users that are actually concerned by the update of the data. It is very unlikely that everyone is concerned by the same update of data.

Calling response.success is not enough to trigger a realtime subscription. You also need to subscribe functions on the super admin interface.
To do so, login on Synchronise (on your own instance) and go to http://yourOwnInstanceUrl/superadmin

You will be facing  an interface with two blocks: "Add new subscription" and "Existing subscriptions"

On the "Add new subscription":
- "Room name" is the name of the function that will trigger an update. In our previous example it was "createUser"
- "Subscription name" is the name of the function that will be recalled when the update occurs. In our previous example it was "getListUsers"
