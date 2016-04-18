'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Note = (function () {
  function Note(client) {
    _classCallCheck(this, Note);

    this.client = client;
  }

  _createClass(Note, [{
    key: 'create',
    value: function create(params, f) {
      return this.client.post('/notes', params, f);
    }
  }, {
    key: 'list',
    value: function list(params, f) {
      return this.client.get('/notes', params, f);
    }
  }, {
    key: 'find',
    value: function find(params, f) {
      return this.client.get('/notes/' + params.id, {}, f);
    }
  }]);

  return Note;
})();

exports['default'] = Note;
module.exports = exports['default'];