'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Company = (function () {
  function Company(client) {
    _classCallCheck(this, Company);

    this.client = client;
  }

  _createClass(Company, [{
    key: 'create',
    value: function create(data, f) {
      return this.client.post('/companies', data, f);
    }
  }, {
    key: 'list',
    value: function list(f) {
      return this.client.get('/companies', {}, f);
    }
  }, {
    key: 'listBy',
    value: function listBy(params, f) {
      return this.client.get('/companies', params, f);
    }
  }, {
    key: 'find',
    value: function find(params, f) {
      return this.client.get('/companies/' + params.id, {}, f);
    }
  }, {
    key: 'listUsers',
    value: function listUsers(params, f) {
      return this.client.get('/companies/' + params.id + '/users', {}, f);
    }
  }]);

  return Company;
})();

exports['default'] = Company;
module.exports = exports['default'];