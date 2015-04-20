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

var _url = require('url');

var _url2 = _interopRequireWildcard(_url);

var _crypto = require('crypto');

var _crypto2 = _interopRequireWildcard(_crypto);

var _glob$fs$exec = require('./promisified');

var _FileNotFoundError$AssetNotFoundError$TaskNotFoundError$CircularDependencyError = require('./errors');

var _writeFile$parseGitHash = require('./util');

'use strict';

var EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

var Task = (function () {
  function Task(config, staticPipeline) {
    _classCallCheck(this, Task);

    this.config = config;
    this.staticPipeline = staticPipeline;
    this.srcDestPairs = [];
  }

  _createClass(Task, [{
    key: 'resolveSrcDest',
    value: function resolveSrcDest() {
      var _this = this;

      return _Bluebird2['default'].resolve(this.config.files || []).map(function (def) {
        if (def.base) {
          return _glob$fs$exec.glob(_path2['default'].resolve(def.base, def.src)).map(function (src) {
            var dest = src.replace(_path2['default'].resolve(def.base), _path2['default'].resolve(def.dest));

            if (def.ext) {
              dest = dest.replace(EXT_REGEX, '.' + def.ext);
            }

            return { src: src, dest: dest };
          });
        }
        var globPath = _path2['default'].resolve(def.src);
        return _glob$fs$exec.glob(globPath).then(function (files) {
          if (!files.length) throw new _FileNotFoundError$AssetNotFoundError$TaskNotFoundError$CircularDependencyError.FileNotFoundError(globPath);
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

      return _Bluebird2['default'].fromNode(function (finish) {
        var self = _this2;

        _this2.config.process({
          src: pair.src,
          dest: pair.dest,
          done: function done(path, content) {
            if (!path && !content) {
              return finish();
            }
            if (!content) {
              content = path;
              path = pair.dest;
            }
            _writeFile$parseGitHash.writeFile(path, content);
            finish();
          },
          write: _writeFile$parseGitHash.writeFile,
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
              callback({ hash: null, hashedDest: pair.dest });
              return;
            }
            var p = undefined;
            if (!files) {
              p = _writeFile$parseGitHash.parseGitHash(pair.src);
            } else if (Array.isArray(files)) {
              p = _Bluebird2['default'].all(files).map(function (file) {
                return _writeFile$parseGitHash.parseGitHash(file);
              }).reduce(function (h, cur) {
                return h.timestamp > cur.timestamp ? h : cur;
              });
            } else {
              p = _writeFile$parseGitHash.parseGitHash(files);
            }
            return p.then(function (h) {
              var hash = h.hash;
              var hashedDest = pair.dest.replace(EXT_REGEX, '-' + hash + '$&');
              return { hash: hash, hashedDest: hashedDest };
            }).nodeify(callback);
          },
          setAsset: _this2.staticPipeline.setAsset.bind(_this2.staticPipeline),
          assets: _this2.staticPipeline.assets.bind(_this2.staticPipeline)
        });
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this3 = this;

      return this.resolveSrcDest().each(function (pair) {
        return _this3.runProcess(pair);
      });
    }
  }]);

  return Task;
})();

exports['default'] = Task;
module.exports = exports['default'];