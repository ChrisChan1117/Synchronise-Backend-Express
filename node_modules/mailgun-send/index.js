/*jslint node: true */
'use strict';

var Mailgun = require('mailgun').Mailgun;


  function mailer() {}

  mailer.prototype.config = function(obj) {
    if (!(typeof obj !== "undefined" && obj !== null ? obj.key : void 0)) { throw('Missing Mailgun API key'); }
    else {
        this._connect(obj.key);
        this._config = obj;
        return this._config;
       }
  };
  
  mailer.prototype._connect = function (key) {
    this._mailer = new Mailgun(key);
  };

  mailer.prototype.buildHeaders = function (headers) {
    var _headers = "\nContent-Type: text/html; charset=utf-8"
      if (headers) _headers = _headers + "; " + headers;
    return _headers;
  }

  mailer.prototype.send = function(data, callback) {
    var raw,
        headers = this.buildHeaders(data.headers);
    if (typeof data.sender === "undefined" || data.sender === null) {
      if (this._config.sender) data.sender = this._config.sender;
      else throw("No Sender specified");
    }

    if (data.recipient instanceof Array && this._config.batchRecipients === false) {
      for (var i = 0; i < data.recipient.length; i++) {
        var to  = data.recipient[i];
        raw = "From: " + data.sender + "\nTo: " + to + headers + "\nSubject: " + data.subject + "\n\n " + data.body;
        this._mailer.sendRaw(data.sender, to, raw, callback);
      }
    } else {
      raw = "From: " + data.sender + "\nTo: " + data.recipient + headers + "\nSubject: " + data.subject + "\n\n " + data.body;
      this._mailer.sendRaw(data.sender, data.recipient, raw, callback);
    }

  };

  
module.exports = new mailer();
