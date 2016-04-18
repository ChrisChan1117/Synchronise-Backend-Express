# iftttmaker
Sending requests to IFTTT Maker channel with `node.js`

## Instalation
`npm install iftttmaker`

## Methods

### require('iftttmaker')(*apiKey*)
Creates an instance of the IFTTTMaker with IFTTT Maker *apiKey*

### IFTTTMaker.send(*action* [, *value1* [, *value2* [, *value3*]]] [, *callback(error)*])
Sends a request with specified *action* and values *value1*, *value2* and *value3* then return to *callback*

## Example
```javascript
var apiKey = 'VJWqWLSLX3gfbvhR1bmYfi';
var IFTTTMaker = require('iftttmaker')(apiKey);

var action = 'notify';

IFTTTMaker.send(action, 'hello', 'world', function (error) {
  if (error) {
    console.log('The request could not be sent:', error);
  } else {
    console.log('Request was sent');
  }
});
```
