var HTTP = require('http');


function IFTTTMaker (apiKey) {
  this.apiKey = apiKey;
}


IFTTTMaker.prototype = {

  parseArgs_: function (args) {
    var i, action, values = {}, callback;

    action = args[0];

    for (i = 1; i < args.length && i <= 3; i++) {
      if (typeof args[i] == 'function') {
        break;
      }

      values[i] = args[i];
    }

    callback = (typeof args[i] == 'function') ? args[i] : function(){};

    return {
      action: action,
      values: values,
      callback: callback
    };
  },

  send: function () {
    var i, args = this.parseArgs_(arguments);

    var url = 'http://maker.ifttt.com/trigger/' + args.action + '/with/key/' + this.apiKey + '?';

    for (i in args.values) {
      if (args.values[i] !== undefined) {
        url += 'value' + i + '=' + encodeURIComponent(args.values[i]) + '&';
      }
    }

    HTTP.get(url, function (res) {
      if (res.statusCode == '200' || res.statusCode == '304') {
        args.callback(false);
      } else {
        args.callback('Bad response code ' + res.statusCode);
      }
    }).on('error', function (e) {
      args.callback(e);
    });
  }

};


module.exports = function (apiKey) {
  return new IFTTTMaker(apiKey);
};
