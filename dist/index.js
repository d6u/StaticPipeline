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

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _util = require('./util');

var _errors = require('./errors');

var _helperFactory = require('./helper-factory');

var _helperFactory2 = _interopRequireDefault(_helperFactory);

var _resolveFile = require('./resolve-file');

var _resolveFile2 = _interopRequireDefault(_resolveFile);

var _gitHashFactory = require('./git-hash-factory');

var _gitHashFactory2 = _interopRequireDefault(_gitHashFactory);

require('babel/polyfill');

var DEFAULT_OPTS = {
  logging: false,
  disableHash: false,
  workingDir: process.cwd(),
  assets: {
    disable: false,
    strict: true,
    baseUrl: '',
    publicDir: null
  }
};

var EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

var StaticPipeline = (function () {

  /**
   * @param {Object} tasks - Dictionary contains defintion for each task
   * @param {Object} [opts] - Additional options
   * @param {bool} [opts.logging=false] - If true, will print messages when
   *                                    each task starts and write files.
   * @param {bool} [opts.disableHash=false] - If true, both hash and gitHash
   *                                        method will return original path
   *                                        as hashedPath
   * @param {string} [opts.workingDir=process.cwd()] - All pathes will be
   *                                                 relative to this path
   * @param {Object} [opts.assets] - Options for assets helper
   * @param {bool} [opts.assets.disable=false] - If true, assets helper will do
   *                                          nothing but return whatever passed
   *                                          in.
   * @param {bool} [opts.assets.strict=true] - If true, will throw an error
   *                                         when provided url cannot match
   *                                         any thing in assetMap.
   * @param {string} [opts.assets.publicDir=null] - Must set if you want to use
   *                                              `assets` helper method.
   *                                              Path part within dest path
   *                                              that matches `publicDir`
   *                                              will be removed to construct
   *                                              a url start with `/`.
   * @param {string} [opts.assets.baseUrl=''] - If defined, it will be prepended
   *                                          to hashedDest within assetMap.
   * @constructor
   */

  function StaticPipeline(tasks, opts) {
    _classCallCheck(this, StaticPipeline);

    this.opts = (0, _lodashObjectAssign2['default'])({}, DEFAULT_OPTS, opts);
    this.tasks = tasks;
    this._assetMap = {};
  }

  _createClass(StaticPipeline, [{
    key: 'start',
    value: function start(target) {
      return _bluebird2['default'].coroutine(this._run.bind(this))(target);
    }
  }, {
    key: '_run',
    value: regeneratorRuntime.mark(function _run(target) {
      var queue, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, task;

      return regeneratorRuntime.wrap(function _run$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            queue = (0, _util.resolveTaskDependencies)(this.tasks, target);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            context$2$0.prev = 4;
            _iterator = queue[Symbol.iterator]();

          case 6:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              context$2$0.next = 12;
              break;
            }

            task = _step.value;
            return context$2$0.delegateYield(this._runTask(task), 't0', 9);

          case 9:
            _iteratorNormalCompletion = true;
            context$2$0.next = 6;
            break;

          case 12:
            context$2$0.next = 18;
            break;

          case 14:
            context$2$0.prev = 14;
            context$2$0.t1 = context$2$0['catch'](4);
            _didIteratorError = true;
            _iteratorError = context$2$0.t1;

          case 18:
            context$2$0.prev = 18;
            context$2$0.prev = 19;

            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }

          case 21:
            context$2$0.prev = 21;

            if (!_didIteratorError) {
              context$2$0.next = 24;
              break;
            }

            throw _iteratorError;

          case 24:
            return context$2$0.finish(21);

          case 25:
            return context$2$0.finish(18);

          case 26:
          case 'end':
            return context$2$0.stop();
        }
      }, _run, this, [[4, 14, 18, 26], [19,, 21, 25]]);
    })
  }, {
    key: '_runTask',
    value: regeneratorRuntime.mark(function _runTask(taskName) {
      var task, log, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, file, fileObjs, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, fileObj;

      return regeneratorRuntime.wrap(function _runTask$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            task = this.tasks[taskName];
            log = this.opts.logging ? (0, _util.createLogger)(taskName) : function () {};

            log('task start');

            if (task.files) {
              context$2$0.next = 6;
              break;
            }

            return context$2$0.delegateYield(this._processTask({}, task.process, {
              log: log
            }), 't2', 5);

          case 5:
            return context$2$0.abrupt('return');

          case 6:
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            context$2$0.prev = 9;
            _iterator2 = task.files[Symbol.iterator]();

          case 11:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              context$2$0.next = 44;
              break;
            }

            file = _step2.value;
            context$2$0.next = 15;
            return (0, _resolveFile2['default'])(file, this.opts);

          case 15:
            fileObjs = context$2$0.sent;
            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            context$2$0.prev = 19;
            _iterator3 = fileObjs[Symbol.iterator]();

          case 21:
            if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
              context$2$0.next = 27;
              break;
            }

            fileObj = _step3.value;
            return context$2$0.delegateYield(this._processTask(fileObj, task.process, {
              log: log
            }), 't3', 24);

          case 24:
            _iteratorNormalCompletion3 = true;
            context$2$0.next = 21;
            break;

          case 27:
            context$2$0.next = 33;
            break;

          case 29:
            context$2$0.prev = 29;
            context$2$0.t4 = context$2$0['catch'](19);
            _didIteratorError3 = true;
            _iteratorError3 = context$2$0.t4;

          case 33:
            context$2$0.prev = 33;
            context$2$0.prev = 34;

            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
              _iterator3['return']();
            }

          case 36:
            context$2$0.prev = 36;

            if (!_didIteratorError3) {
              context$2$0.next = 39;
              break;
            }

            throw _iteratorError3;

          case 39:
            return context$2$0.finish(36);

          case 40:
            return context$2$0.finish(33);

          case 41:
            _iteratorNormalCompletion2 = true;
            context$2$0.next = 11;
            break;

          case 44:
            context$2$0.next = 50;
            break;

          case 46:
            context$2$0.prev = 46;
            context$2$0.t5 = context$2$0['catch'](9);
            _didIteratorError2 = true;
            _iteratorError2 = context$2$0.t5;

          case 50:
            context$2$0.prev = 50;
            context$2$0.prev = 51;

            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
              _iterator2['return']();
            }

          case 53:
            context$2$0.prev = 53;

            if (!_didIteratorError2) {
              context$2$0.next = 56;
              break;
            }

            throw _iteratorError2;

          case 56:
            return context$2$0.finish(53);

          case 57:
            return context$2$0.finish(50);

          case 58:
          case 'end':
            return context$2$0.stop();
        }
      }, _runTask, this, [[9, 46, 50, 58], [19, 29, 33, 41], [34,, 36, 40], [51,, 53, 57]]);
    })
  }, {
    key: '_processTask',
    value: regeneratorRuntime.mark(function _processTask(fileObj, processBlock, opts) {
      var self;
      return regeneratorRuntime.wrap(function _processTask$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            self = this;
            context$2$0.next = 3;
            return _bluebird2['default'].fromNode(function (resolver) {

              var promiseQueue = [];

              var pipeline = {

                src: fileObj.src,
                dest: fileObj.dest,
                log: opts.log,
                setAsset: self.setAsset.bind(self),
                assets: self.makeAssetHelper(),

                gitHash: (0, _gitHashFactory2['default'])({
                  src: fileObj.src,
                  dest: fileObj.dest,
                  disable: self.opts.disableHash
                }),

                done: function done(path, content) {
                  if (!path && !content) return resolver(null, promiseQueue);

                  if (!content) {
                    var _temp = [fileObj.dest, path];
                    path = _temp[0];
                    content = _temp[1];
                    _temp;
                  }

                  this.write(path, content);

                  resolver(null, promiseQueue);
                },

                write: function write(path) {
                  opts.log('writing to ' + _chalk2['default'].green(path));

                  var promise = _util.writeFile.apply(null, arguments);
                  promiseQueue.push(promise);
                  return promise;
                },

                hash: function hash(str) {
                  if (self.opts.disableHash) {
                    return {
                      hash: null,
                      hashedDest: fileObj.dest
                    };
                  }

                  var hash = _crypto2['default'].createHash('md5').update(str).digest('hex');
                  var hashedDest = fileObj.dest.replace(EXT_REGEX, '-' + hash + '$&');

                  return { hash: hash, hashedDest: hashedDest };
                }
              };

              processBlock(pipeline);
            }).all();

          case 3:
          case 'end':
            return context$2$0.stop();
        }
      }, _processTask, this);
    })
  }, {
    key: 'setAsset',
    value: function setAsset(dest, hashedDest) {
      if (this.opts.assets.disable) return;

      if (this.opts.assets.publicDir === null) {
        throw new _errors.ConfigNotFoundError('assets.publicDir');
      }

      var base = _path2['default'].resolve(this.opts.workingDir, this.opts.assets.publicDir);
      var newBase = (this.opts.assets.baseUrl || '').replace(/\/$/, '');

      var url = dest.replace(base, '');
      var hashedUrl = hashedDest.replace(base, newBase);

      this._assetMap[url] = hashedUrl;
    }
  }, {
    key: 'makeAssetHelper',

    // We need this method because helper-factory can be required independently
    value: function makeAssetHelper() {

      // Remove baseUrl option, because we already set them when `setAsset`
      var opts = (0, _lodashObjectAssign2['default'])({}, this.opts.assets, {
        baseUrl: ''
      });

      return (0, _helperFactory2['default'])(this._assetMap, opts);
    }
  }]);

  return StaticPipeline;
})();

exports['default'] = StaticPipeline;
module.exports = exports['default'];