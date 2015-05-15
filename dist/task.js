'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _promisified = require('./promisified');

var _errors = require('./errors');

var _util = require('./util');

'use strict';

var EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

var Task = (function () {
  function Task(name, config, staticPipeline) {
    _classCallCheck(this, Task);

    this.name = name;
    this.config = config;
    this.staticPipeline = staticPipeline;
    this.srcDestPairs = [];
    this._logger = (0, _util.createLogger)(this.name);
    this.log = function () {
      if (this.staticPipeline.opts.logging) this._logger.apply(this, arguments);
    };
  }

  _createClass(Task, [{
    key: 'resolveSrcDest',
    value: function resolveSrcDest() {
      var _this = this;

      return _bluebird2['default'].resolve(this.config.files || []).map(function (def) {
        if (def.base) {
          return (0, _promisified.glob)(_path2['default'].resolve(def.base, def.src)).map(function (src) {
            var dest = src.replace(_path2['default'].resolve(def.base), _path2['default'].resolve(def.dest));

            if (def.ext) {
              dest = dest.replace(EXT_REGEX, '.' + def.ext);
            }

            return { src: src, dest: dest };
          });
        }
        var globPath = _path2['default'].resolve(def.src);
        return (0, _promisified.glob)(globPath).then(function (files) {
          if (!files.length) throw new _errors.FileNotFoundError(globPath);
          return [{ src: files[0], dest: _path2['default'].resolve(def.dest) }];
        });
      }).then(function (pathPairsArr) {
        _this.srcDestPairs = [];
        for (var i = 0; i < pathPairsArr.length; i++) {
          _this.srcDestPairs = _this.srcDestPairs.concat(pathPairsArr[i]);
        }
        return _this.srcDestPairs.length ? _this.srcDestPairs : [{}];
      });
    }
  }, {
    key: 'runProcess',
    value: function runProcess(pair) {
      var _this2 = this;

      return _bluebird2['default'].fromNode(function (finish) {
        var self = _this2;
        var operationQueue = [];

        _this2.config.process({
          src: pair.src,
          dest: pair.dest,
          done: function done(path, content) {
            if (!path && !content) {
              return finish(null, operationQueue);
            }
            if (!content) {
              content = path;
              path = pair.dest;
            }
            this.write(path, content);
            finish(null, operationQueue);
          },
          write: function write(path) {
            self.log('writing to ' + _chalk2['default'].green(path));
            var promise = _util.writeFile.apply(this, arguments);
            operationQueue.push(promise);
            return promise;
          },
          hash: function hash(str) {
            if (self.staticPipeline.opts.disableHash) {
              return { hash: null, hashedDest: pair.dest };
            }
            var hash = _crypto2['default'].createHash('md5').update(str).digest('hex');
            var hashedDest = pair.dest.replace(EXT_REGEX, '-' + hash + '$&');
            return { hash: hash, hashedDest: hashedDest };
          },
          gitHash: function gitHash(files, callback) {
            if (self.staticPipeline.opts.disableHash) {
              callback(null, { hash: null, hashedDest: pair.dest });
              return;
            }
            var p = undefined;
            if (!files) {
              p = (0, _util.parseGitHash)(pair.src);
            } else if (Array.isArray(files)) {
              p = _bluebird2['default'].all(files).map(function (file) {
                return (0, _util.parseGitHash)(file);
              }).reduce(function (h, cur) {
                return h.timestamp > cur.timestamp ? h : cur;
              });
            } else {
              p = (0, _util.parseGitHash)(files);
            }
            return p.then(function (h) {
              var hash = h.hash;
              var hashedDest = pair.dest.replace(EXT_REGEX, '-' + hash + '$&');
              return { hash: hash, hashedDest: hashedDest };
            }).nodeify(callback);
          },
          setAsset: _this2.staticPipeline.setAsset.bind(_this2.staticPipeline),
          assets: _this2.staticPipeline.assets.bind(_this2.staticPipeline),
          log: _this2.log.bind(_this2)
        });
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this3 = this;

      this.log('task start');
      return this.resolveSrcDest().each(function (pair) {
        return _this3.runProcess(pair).all();
      }).then(function () {
        return _this3.log('task finish');
      });
    }
  }]);

  return Task;
})();

exports['default'] = Task;
module.exports = exports['default'];