'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashArrayDifference = require('lodash/array/difference');

var _lodashArrayDifference2 = _interopRequireDefault(_lodashArrayDifference);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _util = require('./util');

var _errors = require('./errors');

var _helperFactory = require('./helper-factory');

var _helperFactory2 = _interopRequireDefault(_helperFactory);

var _resolveFile = require('./resolve-file');

var _resolveFile2 = _interopRequireDefault(_resolveFile);

var _gitHashFactory = require('./git-hash-factory');

var _gitHashFactory2 = _interopRequireDefault(_gitHashFactory);

var _watchMap = require('./watch-map');

var _watchMap2 = _interopRequireDefault(_watchMap);

require('babel/polyfill');

var DEFAULT_OPTS = {
  logging: false,
  disableHash: false,
  workingDir: process.cwd(),
  watching: false,
  assets: {
    disable: false,
    strict: true,
    baseUrl: '',
    publicDir: null
  }
};

var EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

var noop = function noop() {};

var StaticPipeline = (function () {

  /**
   * @constructor
   * @param {Object} tasks                           Dictionary contains defintion for each task
   * @param {Object} [opts]                          Additional options
   * @param {bool}   [opts.logging=false]            If true, will print messages when each task starts and write files.
   * @param {bool}   [opts.disableHash=false]        If true, both hash and gitHash method will return original path as hashedPath.
   * @param {string} [opts.workingDir=process.cwd()] All pathes will be relative to this path.
   * @param {bool}   [opts.watching=true]            If false, all `watch` calls will have no effect.
   * @param {Object} [opts.assets]                   Options for assets helper
   * @param {bool}   [opts.assets.disable=false]     If true, assets helper will do nothing but return whatever passed in.
   * @param {bool}   [opts.assets.strict=true]       If true, will throw an error when provided url cannot match any thing in assetMap.
   * @param {string} [opts.assets.publicDir=null]    Must set if you want to use `assets` helper method. Path part within dest path that matches `publicDir` will be removed to construct a url start with `/`.
   * @param {string} [opts.assets.baseUrl='']        If defined, it will be prepended to hashedDest within assetMap.
   */

  function StaticPipeline(tasks, opts) {
    var _this = this;

    _classCallCheck(this, StaticPipeline);

    this.opts = (0, _lodashObjectAssign2['default'])({}, DEFAULT_OPTS, opts);
    this.tasks = tasks;
    this._assetMap = {};

    if (this.opts.watching) {

      /**
       * A curried function to invoke wrapped task process block
       * @return {Promise} Resolve into a list of files to watch
       * @callback runBlock
       */

      /**
       * Map file changes event to tasks. The structure looks like
       *
       * {
       *   taskName: {
       *     srcFilePath: {
       *       files: string[],
       *       runBlock: function -> Promise -> string[],
       *       glob: bool
       *     }
       *   }
       * }
       *
       * The `files` array contains a list of files that have been watched for `runBlock`.
       * If any of the file changes, `runBlock` will be invoked.
       * The return value of `runBlock` (resolved from returned promise) will be used to update `files`.
       *
       * @type {WatchMap}
       */
      this._watcherMap = new _watchMap2['default']();

      /**
       * Save glob pattern for each task with glob defined. It will be used to match against added files during watch.
       *
       * {
       *   taskName: {
       *     globPattern: string,
       *     process: function
       *   }
       * }
       *
       * @type {Map}
       */
      this._watchGlobMap = new Map();

      this._watcher = _chokidar2['default'].watch(null, {
        persistent: true,
        ignoreInitial: true
      });

      this._watcher.on('change', function (path) {
        return _this._fileChanged(path);
      });
      this._watcher.on('unlink', function (path) {
        return _this._fileRemoved(path);
      });
      this._watcher.on('add', function (path) {
        return _this._fileAdded(path);
      });
    }
  }

  _createClass(StaticPipeline, [{
    key: 'start',
    value: function start(target) {
      return this._run(target);
    }
  }, {
    key: '_run',
    value: function _run(target) {
      var queue, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, task;

      return regeneratorRuntime.async(function _run$(context$2$0) {
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
              context$2$0.next = 13;
              break;
            }

            task = _step.value;
            context$2$0.next = 10;
            return regeneratorRuntime.awrap(this._runTask(task));

          case 10:
            _iteratorNormalCompletion = true;
            context$2$0.next = 6;
            break;

          case 13:
            context$2$0.next = 19;
            break;

          case 15:
            context$2$0.prev = 15;
            context$2$0.t0 = context$2$0['catch'](4);
            _didIteratorError = true;
            _iteratorError = context$2$0.t0;

          case 19:
            context$2$0.prev = 19;
            context$2$0.prev = 20;

            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }

          case 22:
            context$2$0.prev = 22;

            if (!_didIteratorError) {
              context$2$0.next = 25;
              break;
            }

            throw _iteratorError;

          case 25:
            return context$2$0.finish(22);

          case 26:
            return context$2$0.finish(19);

          case 27:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[4, 15, 19, 27], [20,, 22, 26]]);
    }
  }, {
    key: '_runTask',
    value: function _runTask(taskName) {
      var task, log, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, file, fileObjs, isGlob, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, fileObj;

      return regeneratorRuntime.async(function _runTask$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            task = this.tasks[taskName];
            log = this.opts.logging ? (0, _util.createLogger)(taskName) : noop;

            log('task start');

            if (task.files) {
              context$2$0.next = 8;
              break;
            }

            context$2$0.next = 6;
            return regeneratorRuntime.awrap(this._dispatchTask({}, task.process, { log: log, taskName: taskName, isGlob: false }));

          case 6:
            context$2$0.next = 70;
            break;

          case 8:
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            context$2$0.prev = 11;
            _iterator2 = task.files[Symbol.iterator]();

          case 13:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              context$2$0.next = 56;
              break;
            }

            file = _step2.value;

            if (file.base && this.opts.watching) {
              this._updateGlobWatchTask(taskName, file, task.process);
            }

            fileObjs = undefined;
            context$2$0.prev = 17;
            context$2$0.next = 20;
            return regeneratorRuntime.awrap((0, _resolveFile2['default'])(file, {
              workingDir: this.opts.workingDir
            }));

          case 20:
            fileObjs = context$2$0.sent;
            context$2$0.next = 26;
            break;

          case 23:
            context$2$0.prev = 23;
            context$2$0.t0 = context$2$0['catch'](17);

            (0, _util.throwError)(context$2$0.t0);

          case 26:
            isGlob = typeof file.base !== 'undefined';
            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            context$2$0.prev = 30;
            _iterator3 = fileObjs[Symbol.iterator]();

          case 32:
            if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
              context$2$0.next = 39;
              break;
            }

            fileObj = _step3.value;
            context$2$0.next = 36;
            return regeneratorRuntime.awrap(this._dispatchTask(fileObj, task.process, { log: log, taskName: taskName, isGlob: isGlob }));

          case 36:
            _iteratorNormalCompletion3 = true;
            context$2$0.next = 32;
            break;

          case 39:
            context$2$0.next = 45;
            break;

          case 41:
            context$2$0.prev = 41;
            context$2$0.t1 = context$2$0['catch'](30);
            _didIteratorError3 = true;
            _iteratorError3 = context$2$0.t1;

          case 45:
            context$2$0.prev = 45;
            context$2$0.prev = 46;

            if (!_iteratorNormalCompletion3 && _iterator3['return']) {
              _iterator3['return']();
            }

          case 48:
            context$2$0.prev = 48;

            if (!_didIteratorError3) {
              context$2$0.next = 51;
              break;
            }

            throw _iteratorError3;

          case 51:
            return context$2$0.finish(48);

          case 52:
            return context$2$0.finish(45);

          case 53:
            _iteratorNormalCompletion2 = true;
            context$2$0.next = 13;
            break;

          case 56:
            context$2$0.next = 62;
            break;

          case 58:
            context$2$0.prev = 58;
            context$2$0.t2 = context$2$0['catch'](11);
            _didIteratorError2 = true;
            _iteratorError2 = context$2$0.t2;

          case 62:
            context$2$0.prev = 62;
            context$2$0.prev = 63;

            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
              _iterator2['return']();
            }

          case 65:
            context$2$0.prev = 65;

            if (!_didIteratorError2) {
              context$2$0.next = 68;
              break;
            }

            throw _iteratorError2;

          case 68:
            return context$2$0.finish(65);

          case 69:
            return context$2$0.finish(62);

          case 70:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[11, 58, 62, 70], [17, 23], [30, 41, 45, 53], [46,, 48, 52], [63,, 65, 69]]);
    }
  }, {
    key: '_dispatchTask',

    /**
     * @callback taskProcess
     * @param    {Object} pipeline An object contains helper function to help run a task
     * @return   {void}
     */

    /**
     * Dispatch task execution to `process` block with each src file.
     * This will wrap taskProcess within an re-runable function for reuse upon file change.
     * @param  {Object}      fileObj       An object with src and dest path
     * @param  {string}      fileObj.src   Source file
     * @param  {string}      fileObj.dest  Destination file
     * @param  {taskProcess} taskProcess   Function defined to actually execute tasks
     * @param  {Object}      opts          Additional objects to run current `process` block
     * @param  {Function}    opts.log      A log function with current task name as console prefix
     * @param  {string}      opts.taskName Current task name
     * @param  {bool}        opts.isGlob   True is current file was retrieved from a glob pattern
     * @return {void}
     */
    value: function _dispatchTask(fileObj, taskProcess, opts) {
      var self, runBlock;
      return regeneratorRuntime.async(function _dispatchTask$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            runBlock = function runBlock() {
              var watchList, hasError;
              return regeneratorRuntime.async(function runBlock$(context$3$0) {
                while (1) switch (context$3$0.prev = context$3$0.next) {
                  case 0:
                    context$3$0.next = 2;
                    return regeneratorRuntime.awrap(self._processTask(fileObj, taskProcess, {
                      log: opts.log
                    }));

                  case 2:
                    watchList = context$3$0.sent;

                    if (self.opts.watching) {
                      hasError = false;

                      if (!watchList) {
                        hasError = true;
                        watchList = [fileObj.src];
                      }

                      self._updateWatchTask(opts.taskName, '' + fileObj.src, watchList, runBlock, {
                        isGlob: opts.isGlob,
                        hasError: hasError
                      });
                    }

                  case 4:
                  case 'end':
                    return context$3$0.stop();
                }
              }, null, this);
            };

            self = this;
            context$2$0.next = 4;
            return regeneratorRuntime.awrap(runBlock());

          case 4:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }, {
    key: '_processTask',

    /**
     * Actually invoke the taskProcess function.
     * @param  {Object}        fileObj      An object with src and dest path
     * @param  {string}        fileObj.src  Source file
     * @param  {string}        fileObj.dest Destination file
     * @param  {taskProcess}   processBlock Function defined to actually execute tasks
     * @param  {Object}        opts         Additional objects to run current `process` block
     * @param  {Function}      opts.log     A log function with current task name as console prefix
     * @return {string[]|void}              A list of path to watch changes for. If processBlock emitted error, return undefined.
     */
    value: function _processTask(fileObj, processBlock, opts) {
      var self, watchList, watched;
      return regeneratorRuntime.async(function _processTask$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            self = this;
            watchList = fileObj.src ? [fileObj.src] : [];
            watched = false;
            context$2$0.next = 5;
            return regeneratorRuntime.awrap(_bluebird2['default'].fromNode(function (resolver) {

              var promiseQueue = [];

              var pipeline = {

                src: fileObj.src,
                dest: fileObj.dest,
                log: opts.log,
                setAsset: self._setAsset.bind(self),
                assets: self._makeAssetHelper(),

                gitHash: (0, _gitHashFactory2['default'])({
                  src: fileObj.src,
                  dest: fileObj.dest,
                  disable: self.opts.disableHash
                }),

                done: function done(path, content) {
                  if (!path && !content) return resolver(null, promiseQueue);

                  if (!content) {
                    var _ref = [fileObj.dest, path];
                    path = _ref[0];
                    content = _ref[1];
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
                },

                /**
                 * Add file to watchList
                 * @param  {string[]} files - Additional file to watch
                 * @return {void}
                 */
                watch: function watch() {
                  var files = arguments[0] === undefined ? [] : arguments[0];

                  if (!Array.isArray(files)) {
                    throw new Error('watch arguments must be an array');
                  }

                  watched = true;

                  var _iteratorNormalCompletion4 = true;
                  var _didIteratorError4 = false;
                  var _iteratorError4 = undefined;

                  try {
                    for (var _iterator4 = files[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                      var file = _step4.value;

                      var absPath = _path2['default'].resolve(file);
                      if (watchList.indexOf(absPath) === -1) {
                        watchList.push(absPath);
                      }
                    }
                  } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                  } finally {
                    try {
                      if (!_iteratorNormalCompletion4 && _iterator4['return']) {
                        _iterator4['return']();
                      }
                    } finally {
                      if (_didIteratorError4) {
                        throw _iteratorError4;
                      }
                    }
                  }
                }
              };

              processBlock(pipeline);
            }).all().then(function () {
              return watched ? watchList : [];
            })['catch'](function (err) {
              if (err.stack) {
                console.log(err.stack);
              } else {
                console.log(err);
              }
            }));

          case 5:
            return context$2$0.abrupt('return', context$2$0.sent);

          case 6:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }, {
    key: '_updateWatchTask',

    /**
     * Add / romove files to the watcher
     * @param  {string}   taskName      Task name
     * @param  {string}   fileKey       Entry src file path
     * @param  {string[]} files         A list of file belongs to current runBlock
     * @param  {Function} runBlock      An async function to invoke the underlying build process.
     * @param  {Object}   opts          Additional options
     * @param  {bool}     opts.isGlob   Indicate if this fileKey is generated based on a glob pattern.
     * @param  {bool}     opts.hasError If process block emit error, this will be true.
     * @return {void}
     */
    value: function _updateWatchTask(taskName, fileKey, files, runBlock, opts) {

      if (!this._watcherMap.has(taskName, fileKey)) {

        this._watcherMap.put(taskName, fileKey, {
          files: files,
          runBlock: runBlock,
          glob: opts.glob
        });

        this._watcher.add(files);
      } else if (!opts.hasError) {

        var curFiles = this._watcherMap.get(taskName, fileKey).files;
        var newFiles = (0, _lodashArrayDifference2['default'])(files, curFiles);
        var oldFiles = (0, _lodashArrayDifference2['default'])(curFiles, files);

        var shared = false;

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = oldFiles[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var file = _step5.value;
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {

              for (var _iterator6 = this._watcherMap[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                var _step6$value = _slicedToArray(_step6.value, 3);

                var task = _step6$value[0];
                var srcFile = _step6$value[1];
                var detail = _step6$value[2];

                if (task === taskName && srcFile === fileKey) continue;

                if (detail.files.indexOf(file) > -1) {
                  shared = true;
                  break;
                }
              }
            } catch (err) {
              _didIteratorError6 = true;
              _iteratorError6 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                  _iterator6['return']();
                }
              } finally {
                if (_didIteratorError6) {
                  throw _iteratorError6;
                }
              }
            }

            if (!shared) this._watcher.unwatch(file);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5['return']) {
              _iterator5['return']();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        this._watcher.add(newFiles);

        this._watcherMap.get(taskName, fileKey).files = files;
      }
    }
  }, {
    key: '_updateGlobWatchTask',

    /**
     * Update the map for glob watcher.
     * @param  {string}   taskName     Task name
     * @param  {Object}   fileObj      The original fileObj in task defination
     * @param  {Function} processBlock The original process function defined by user
     * @return {void}
     */
    value: function _updateGlobWatchTask(taskName, fileObj, processBlock) {
      var globPattern = _path2['default'].resolve(this.opts.workingDir, fileObj.base, fileObj.src);

      if (!this._watchGlobMap.has(taskName)) {
        this._watchGlobMap.set(taskName, {
          globPattern: globPattern,
          fileDef: fileObj,
          process: processBlock
        });

        this._watcher.add(globPattern);
      }
    }
  }, {
    key: '_fileChanged',
    value: function _fileChanged(file) {
      var found, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, _step7$value, detail;

      return regeneratorRuntime.async(function _fileChanged$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            found = false;
            _iteratorNormalCompletion7 = true;
            _didIteratorError7 = false;
            _iteratorError7 = undefined;
            context$2$0.prev = 4;
            _iterator7 = this._watcherMap[Symbol.iterator]();

          case 6:
            if (_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done) {
              context$2$0.next = 16;
              break;
            }

            _step7$value = _slicedToArray(_step7.value, 3);
            detail = _step7$value[2];

            if (!(detail.files.indexOf(file) > -1)) {
              context$2$0.next = 13;
              break;
            }

            found = true;

            context$2$0.next = 13;
            return regeneratorRuntime.awrap(detail.runBlock());

          case 13:
            _iteratorNormalCompletion7 = true;
            context$2$0.next = 6;
            break;

          case 16:
            context$2$0.next = 22;
            break;

          case 18:
            context$2$0.prev = 18;
            context$2$0.t0 = context$2$0['catch'](4);
            _didIteratorError7 = true;
            _iteratorError7 = context$2$0.t0;

          case 22:
            context$2$0.prev = 22;
            context$2$0.prev = 23;

            if (!_iteratorNormalCompletion7 && _iterator7['return']) {
              _iterator7['return']();
            }

          case 25:
            context$2$0.prev = 25;

            if (!_didIteratorError7) {
              context$2$0.next = 28;
              break;
            }

            throw _iteratorError7;

          case 28:
            return context$2$0.finish(25);

          case 29:
            return context$2$0.finish(22);

          case 30:
            if (found) {
              context$2$0.next = 32;
              break;
            }

            throw new Error('Cannot find related task for ' + file);

          case 32:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[4, 18, 22, 30], [23,, 25, 29]]);
    }
  }, {
    key: '_fileRemoved',
    value: function _fileRemoved(file) {
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = this._watcherMap[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var _step8$value = _slicedToArray(_step8.value, 3);

          var task = _step8$value[0];
          var srcFile = _step8$value[1];
          var detail = _step8$value[2];

          if (srcFile === file) {
            if (!detail.isGlob) {
              throw new Error('Not globbed path should not be removed.');
            }

            this._updateWatchTask(task, srcFile, [], detail.runBlock);
          } else if (detail.files.indexOf(file) > -1) {
            var filesLeft = (0, _lodashArrayDifference2['default'])(detail.files, [file]);
            this._updateWatchTask(task, srcFile, filesLeft, detail.runBlock);
          }
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8['return']) {
            _iterator8['return']();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    }
  }, {
    key: '_fileAdded',
    value: function _fileAdded(file) {
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = this._watchGlobMap[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var _step9$value = _slicedToArray(_step9.value, 2);

          var taskName = _step9$value[0];
          var detail = _step9$value[1];

          if ((0, _minimatch2['default'])(file, detail.globPattern)) {

            var dest = file.replace(_path2['default'].resolve(this.opts.workingDir, detail.fileDef.base), _path2['default'].resolve(this.opts.workingDir, detail.fileDef.dest));

            var fileObj = { src: file, dest: dest };

            this._dispatchTask(fileObj, detail.process, {
              taskName: taskName,
              log: this.opts.logging ? (0, _util.createLogger)(taskName) : noop,
              isGlob: true
            });
          }
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9['return']) {
            _iterator9['return']();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }
    }
  }, {
    key: '_setAsset',
    value: function _setAsset(dest, hashedDest) {
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
    key: '_makeAssetHelper',

    // We need this method because helper-factory can be required independently
    value: function _makeAssetHelper() {

      // Remove baseUrl option, because we already set them when `_setAsset`
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