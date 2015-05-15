'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _task = require('./task');

var _task2 = _interopRequireDefault(_task);

var _util = require('./util');

var _errors = require('./errors');

var _lodashNodeModernObjectMerge = require('lodash-node/modern/object/merge');

var _lodashNodeModernObjectMerge2 = _interopRequireDefault(_lodashNodeModernObjectMerge);

'use strict';

var DEFAULT_OPTS = {
  logging: false,
  disableHash: false,
  assets: {
    useMap: true,
    forceMap: false,
    publicDir: null,
    baseUrl: null
  }
};

var StaticPipeline = (function () {
  function StaticPipeline() {
    _classCallCheck(this, StaticPipeline);

    this.tasks = [];
    this.opts = {};
    this.assetsMap = {};
  }

  _createClass(StaticPipeline, [{
    key: 'config',
    value: function config(configBlock) {
      var configObj = {};
      configBlock(configObj);
      this.tasks = configObj.tasks;

      this.opts = (0, _lodashNodeModernObjectMerge2['default'])({}, DEFAULT_OPTS, configObj.options);
      this.opts.assets.useMap = typeof this.opts.assets.useMap === 'undefined' ? true : this.opts.assets.useMap;

      return this;
    }
  }, {
    key: 'setAsset',
    value: function setAsset(dest, hashedDest) {
      if (this.opts.assets.publicDir == null) {
        throw new _errors.ConfigNotFoundError('assets.publicDir');
      }
      var base = _path2['default'].resolve(this.opts.assets.publicDir);
      var newBase = (this.opts.assets.baseUrl || '').replace(/\/$/, '');
      var url = dest.replace(base, '');
      var hashedUrl = hashedDest.replace(base, newBase);
      this.assetsMap[url] = hashedUrl;
    }
  }, {
    key: 'assets',
    value: function assets(url) {
      if (!url) return this.assetsMap;
      if (this.opts.assets.useMap) {
        var hashedUrl = this.assetsMap[url];
        if (hashedUrl) {
          return hashedUrl;
        } else if (this.opts.assets.forceMap) {
          throw new _errors.AssetNotFoundError(url);
        }
      }
      return url;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this = this;

      return _bluebird2['default']['try'](function () {
        var queue = (0, _util.resolveTaskDependencies)(_this.tasks);
        return _bluebird2['default'].resolve(queue).each(function (taskName) {
          return new _task2['default'](taskName, _this.tasks[taskName], _this).run();
        });
      });
    }
  }]);

  return StaticPipeline;
})();

exports['default'] = StaticPipeline;
module.exports = exports['default'];