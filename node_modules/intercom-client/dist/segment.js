'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Segment = (function () {
  function Segment(client) {
    _classCallCheck(this, Segment);

    this.client = client;
  }

  _createClass(Segment, [{
    key: 'list',
    value: function list(f) {
      return this.client.get('/segments', {}, f);
    }
  }, {
    key: 'find',
    value: function find(params, f) {
      return this.client.get('/segments/' + params.id, {}, f);
    }
  }]);

  return Segment;
})();

exports['default'] = Segment;
module.exports = exports['default'];