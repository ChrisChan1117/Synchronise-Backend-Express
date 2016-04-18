'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Conversation = (function () {
  function Conversation(client) {
    _classCallCheck(this, Conversation);

    this.client = client;
  }

  _createClass(Conversation, [{
    key: 'list',
    value: function list(data, f) {
      return this.client.get('/conversations', data, f);
    }
  }, {
    key: 'find',
    value: function find(params, f) {
      return this.client.get('/conversations/' + params.id, params, f);
    }
  }, {
    key: 'reply',
    value: function reply(params, f) {
      return this.client.post('/conversations/' + params.id + '/reply', params, f);
    }
  }, {
    key: 'markAsRead',
    value: function markAsRead(params, f) {
      return this.client.put('/conversations/' + params.id, { read: true }, f);
    }
  }]);

  return Conversation;
})();

exports['default'] = Conversation;
module.exports = exports['default'];