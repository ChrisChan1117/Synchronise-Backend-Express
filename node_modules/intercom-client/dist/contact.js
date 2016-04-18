'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Contact = (function () {
  function Contact(client) {
    _classCallCheck(this, Contact);

    this.client = client;
  }

  _createClass(Contact, [{
    key: 'create',
    value: function create() {
      var parameters_or_function = arguments[0];
      var params = {};
      var callback = parameters_or_function;
      if (typeof parameters_or_function !== 'function') {
        params = parameters_or_function;
        callback = arguments[1];
      }
      return this.client.post('/contacts', params, callback);
    }
  }, {
    key: 'update',
    value: function update(params, f) {
      return this.client.post('/contacts', params, f);
    }
  }, {
    key: 'list',
    value: function list(f) {
      return this.client.get('/contacts', {}, f);
    }
  }, {
    key: 'listBy',
    value: function listBy(params, f) {
      return this.client.get('/contacts', params, f);
    }
  }, {
    key: 'find',
    value: function find(params, f) {
      return this.client.get('/contacts/' + params.id, {}, f);
    }
  }, {
    key: 'delete',
    value: function _delete(params, f) {
      return this.client['delete']('/contacts/' + params.id, {}, f);
    }
  }, {
    key: 'convert',
    value: function convert(params, f) {
      return this.client.post('/contacts/convert', params, f);
    }
  }]);

  return Contact;
})();

exports['default'] = Contact;
module.exports = exports['default'];