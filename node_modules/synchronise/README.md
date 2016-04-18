[Synchronise.IO](https://www.synchronise.io)
--------------

The Javascript client allows you to communicate with Synchronise from your Node.JS server.
The library communicates with Synchronise using Web Sockets for faster transfer and better development experience as well as better user experience. We have implemented socket connection using the open source library [Socket.IO](http://socket.io/) because it provides cross-platform compatibility.

----------


### Setup

    npm install synchronise


----------


### Init
To load the package for Synchronise in your Node.Js script simply use:

    var Synchronise = require('synchronise');
		Synchronise.init("[YOUR PUBLIC KEY]");

Alternatively you can also initialise the library directly when you require it:

    var Synchronise = require('synchronise')("[YOUR PUBLIC KEY]");

You can find your Public Key on the export section of a Component.

![Find your public key](https://images.synchronise.io/public_key.png)


----------


### Connection / Disconnection
Since your users could potentially be using your app on an unstable network we decided to provide you with a way in managing your app in consequence. You can be notified programmatically when the connection between your app and Synchronise is lost or reacquired. The library will always try to reconnect to Synchronise on the background. We have also implemented some mechanisms to automatically queue the requests and retry them when the connection is re-established.

The library triggers 2 type of events Connected and Lost. Both events can be propagated to any function of your app using a callback mechanism. The events might be called multiples times during the life cycle of your app since connection and disconnection can occur many times if the internet connection is unstable.

#### Connected

    Synchronise.Connection.Connected(function(){
	    // Code to execute every time the connection is established (or re-established)
    });

#### Lost

    Synchronise.Connection.Lost(function(){
	    // Code to execute every time the connection is established (or re-established)
    });

**Important:** The Connected/Lost events are taken from the Javascript library and are implemented in Node.JS for consistency. Your server is less likely to receive Connected/Lost events since it is using a stable and consistent connection. A good example of using the connections events in Node.JS is for executing some other code on your server only when the connection with Synchronise has been established.


----------


### Component
#### Run
The run method allows you to execute a component on our Cloud.

**Parameters:**

 - (String)id_component: The first parameter is the ID of the component.
   It is provided to you on the interface on www.synchronise.io
 - (JSON)parameters: A JSON Key-value for all of the parameters you want
   to send to the component. If there is no parameter to send simply   
   provide an empty JSON {}
 - (Object)callbacks: The list of callbacks    triggered by the
   execution of the Component
	   - **success**: Is called if the execution of the Component has succeeded. The first parameter of the callback contains the data provided by the component (if any)
	   - **error**: The error callback is triggered if the component has timed out or if its execution has failed. The first parameter of the callback contains the err object describing the reason for failing
	   - **progress**: The progress callback allows you to retrieve data from the component before its execution ends. This is useful if the component execution takes a long time. This paremeter is optional and will not be triggered if progress method is not called by the component on the cloud. The first parameter of the callback is the data coming from the component (if any)
	   - **always**: The always callback allows you to know when the execution of the component is done. It is triggered whether the component succeeds or not. This is useful for example to stop know when to hide a loading image if you had put one on your interface while the component was executing. The always callback is not triggered by the progress callback

**Example:**
```
Synchronise.Component.run("ID-OF-THE-COMPONENT", {/* param1:"val1"... */}, {
    success: function(data){
    },
    error: function(error){
    },
    progress: function(data){
	    // Optional, called only if the component implements it
    },
    always: function(){
	    // Called every time success or error is called
    }
});
```
