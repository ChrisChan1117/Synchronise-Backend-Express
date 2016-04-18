'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

exports.Client = _client2['default'];

var _user = require('./user');

var _user2 = _interopRequireDefault(_user);

exports.User = _user2['default'];

var SecureMode = (function () {
  function SecureMode() {
    _classCallCheck(this, SecureMode);
  }

  _createClass(SecureMode, null, [{
    key: 'userHash',
    value: function userHash(params) {
      var secretKey = params.secretKey;
      var identifier = params.identifier;
      if (!secretKey) {
        throw new Error('secretKey must be provided');
      }
      if (!identifier) {
        throw new Error('identifier must be provided');
      }
      return _crypto2['default'].createHmac('sha256', secretKey).update(identifier).digest('hex');
    }
  }]);

  return SecureMode;
})();

exports.SecureMode = SecureMode;