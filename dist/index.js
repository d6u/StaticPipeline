'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Bluebird = require('bluebird');

var _Bluebird2 = _interopRequireWildcard(_Bluebird);

var _path = require('path');

var _path2 = _interopRequireWildcard(_path);

var _Task = require('./task');

var _Task2 = _interopRequireWildcard(_Task);

var _resolveTaskDependencies = require('./util');

var _AssetNotFoundError$ConfigNotFoundError = require('./errors');

var _merge = require('lodash-node/modern/object/merge');

var _merge2 = _interopRequireWildcard(_merge);

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

      this.opts = _merge2['default']({}, DEFAULT_OPTS, configObj.options);
      this.opts.assets.useMap = typeof this.opts.assets.useMap === 'undefined' ? true : this.opts.assets.useMap;

      return this;
    }
  }, {
    key: 'setAsset',
    value: function setAsset(dest, hashedDest) {
      if (this.opts.assets.publicDir == null) {
        throw new _AssetNotFoundError$ConfigNotFoundError.ConfigNotFoundError('assets.publicDir');
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
      if (!url) {
        return this.assetsMap;
      }if (this.opts.assets.useMap) {
        var hashedUrl = this.assetsMap[url];
        if (hashedUrl) {
          return hashedUrl;
        } else if (this.opts.assets.forceMap) {
          throw new _AssetNotFoundError$ConfigNotFoundError.AssetNotFoundError(url);
        }
      }
      return url;
    }
  }, {
    key: 'run',
    value: function run() {
      var _this = this;

      return _Bluebird2['default']['try'](function () {
        var queue = _resolveTaskDependencies.resolveTaskDependencies(_this.tasks);
        return _Bluebird2['default'].resolve(queue).each(function (taskName) {
          return new _Task2['default'](taskName, _this.tasks[taskName], _this).run();
        });
      });
    }
  }]);

  return StaticPipeline;
})();

exports['default'] = StaticPipeline;
module.exports = exports['default'];