import Bluebird from 'bluebird';
import path from 'path';
import assign from 'lodash/object/assign';
import difference from 'lodash/array/difference';
import chalk from 'chalk';
import chokidar from 'chokidar';
import crypto from 'crypto';
import { writeFile, resolveTaskDependencies, createLogger } from './util';
import { ConfigNotFoundError } from './errors';
import helperFactory from './helper-factory';
import resolveFile from './resolve-file';
import gitHashFactory from './git-hash-factory';

require('babel/polyfill');

const DEFAULT_OPTS = {
  logging: false,
  disableHash: false,
  workingDir: process.cwd(),
  watching: true,
  assets: {
    disable: false,
    strict: true,
    baseUrl: '',
    publicDir: null
  }
};

const EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

export default class StaticPipeline {

  /**
   * @param {Object} tasks - Dictionary contains defintion for each task
   * @param {Object} [opts] - Additional options
   * @param {bool} [opts.logging=false] - If true, will print messages when each task starts and write files.
   * @param {bool} [opts.disableHash=false] - If true, both hash and gitHash method will return original path as hashedPath.
   * @param {string} [opts.workingDir=process.cwd()] - All pathes will be relative to this path.
   * @param {bool} [opts.watching=true] - If false, all `watch` calls will have no effect.
   * @param {Object} [opts.assets] - Options for assets helper
   * @param {bool} [opts.assets.disable=false] - If true, assets helper will do nothing but return whatever passed in.
   * @param {bool} [opts.assets.strict=true] - If true, will throw an error when provided url cannot match any thing in assetMap.
   * @param {string} [opts.assets.publicDir=null] - Must set if you want to use `assets` helper method. Path part within dest path that matches `publicDir` will be removed to construct a url start with `/`.
   * @param {string} [opts.assets.baseUrl=''] - If defined, it will be prepended to hashedDest within assetMap.
   * @constructor
   */
  constructor(tasks, opts) {
    this.opts = assign({}, DEFAULT_OPTS, opts);
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
       *       runBlock: function -> Promise -> string[]
       *     }
       *   }
       * }
       *
       * The `files` array contains a list of files that have been watched for `runBlock`.
       * If any of the file changes, `runBlock` will be invoked.
       * The return value of `runBlock` (resolved from returned promise) will be used to update `files`.
       *
       * @type {Map}
       */
      this._watcherMap = new Map();

      this._watcher = chokidar.watch(null, {
        persistent: true
      });

      this._watcher.on('change', path => Bluebird.coroutine(this._fileChanged).call(this, path));
    } else {
      this._watcher = null;
    }
  }

  start(target) {
    return Bluebird.coroutine(this._run).call(this, target);
  }

  * _run(target) {
    let queue = resolveTaskDependencies(this.tasks, target);

    for (let task of queue) {
      yield* this._runTask(task);
    }
  }

  * _runTask(taskName) {
    let task = this.tasks[taskName];
    let log = this.opts.logging ? createLogger(taskName) : function () {};

    log('task start');

    if (!task.files) {
      yield* this._dispatchTask({}, task.process, { log, taskName });
      return;
    }

    for (let file of task.files) {
      let fileObjs = yield resolveFile(file, this.opts);

      for (let fileObj of fileObjs) {
        yield* this._dispatchTask(fileObj, task.process, { log, taskName });
      }
    }
  }

  * _dispatchTask(fileObj, taskProcess, opts) {
    let self = this;

    let runBlock = Bluebird.coroutine(function* () {
      return yield* self._processTask(fileObj, taskProcess, opts);
    });

    let watchList = yield runBlock();

    if (this.opts.watching && watchList.length) {
      this._updateWatchTask(opts.taskName, `${fileObj.src}`, watchList, runBlock);
    }
  }

  * _processTask(fileObj, processBlock, opts) {
    let self = this;
    let watchList = fileObj.src ? [fileObj.src] : [];

    yield Bluebird.fromNode(function (resolver) {

      let promiseQueue = [];

      let pipeline = {

        src: fileObj.src,
        dest: fileObj.dest,
        log: opts.log,
        setAsset: self._setAsset.bind(self),
        assets: self._makeAssetHelper(),

        gitHash: gitHashFactory({
          src: fileObj.src,
          dest: fileObj.dest,
          disable: self.opts.disableHash
        }),

        done(path, content) {
          if (!path && !content) return resolver(null, promiseQueue);

          if (!content) {
            [path, content] = [fileObj.dest, path];
          }

          this.write(path, content);

          resolver(null, promiseQueue);
        },

        write(path) {
          opts.log(`writing to ${chalk.green(path)}`);

          let promise = writeFile.apply(null, arguments);
          promiseQueue.push(promise);
          return promise;
        },

        hash(str) {
          if (self.opts.disableHash) {
            return {
              hash: null,
              hashedDest: fileObj.dest
            };
          }

          let hash = crypto.createHash('md5').update(str).digest('hex');
          let hashedDest = fileObj.dest.replace(EXT_REGEX, `-${hash}$&`);

          return { hash, hashedDest };
        },

        /**
         * Add file to watchList
         * @param  {string[]} files - Additional file to watch
         * @return {void}
         */
        watch(files = []) {
          if (!Array.isArray(files)) {
            throw new Error('watch arguments must be an array');
          }

          for (let file of files) {
            let absPath = path.resolve(file);
            if (watchList.indexOf(absPath) === -1) {
              watchList.push(absPath);
            }
          }
        }
      };

      processBlock(pipeline);

    }).all();

    return watchList;
  }

  /**
   * Add / romove files to the watcher
   * @param {string} taskName - Target task name
   * @param {string} fileKey - Entry src file path
   * @param  {string[]} files - A list of file belongs to current runBlock
   * @param  {Generator} runBlock - A generator function to invoke the underlying build process. Return a updated list of files to watch.
   * @return {void}
   */
  _updateWatchTask(taskName, fileKey, files, runBlock) {

    if (!this._watcherMap.has(taskName)) {
      this._watcherMap.set(taskName, new Map());
    }

    if (!this._watcherMap.get(taskName).has(fileKey)) {
      this._watcherMap.get(taskName).set(fileKey, {
        files: files,
        runBlock: runBlock
      });
      this._watcher.add(files);
      return;
    }

    let curFiles = this._watcherMap.get(taskName).get(fileKey).files;
    let newFiles = difference(files, curFiles);
    let oldFiles = difference(curFiles, files);

    for (let file of oldFiles) {
      this._watcher.unwatch(file);
    }

    this._watcher.add(newFiles);

    this._watcherMap.get(taskName).get(fileKey).files = files;
  }

  * _fileChanged(file) {
    let found = false;

    for (let [taskName, fileMap] of this._watcherMap) {
      for (let [fileKey, obj] of fileMap) {
        if (obj.files.indexOf(file) > -1) {
          found = true;

          let runBlock = obj.runBlock;

          let watchList = yield runBlock();

          this._updateWatchTask(taskName, fileKey, watchList, runBlock);
        }
      }
    }

    if (!found) {
      throw new Error(`Cannot find related task for ${file}`);
    }
  }

  _setAsset(dest, hashedDest) {
    if (this.opts.assets.disable) return;

    if (this.opts.assets.publicDir === null) {
      throw new ConfigNotFoundError('assets.publicDir');
    }

    let base = path.resolve(this.opts.workingDir, this.opts.assets.publicDir);
    let newBase = (this.opts.assets.baseUrl || '').replace(/\/$/, '');

    let url = dest.replace(base, '');
    let hashedUrl = hashedDest.replace(base, newBase);

    this._assetMap[url] = hashedUrl;
  }

  // We need this method because helper-factory can be required independently
  _makeAssetHelper() {

    // Remove baseUrl option, because we already set them when `_setAsset`
    let opts = assign({}, this.opts.assets, {
      baseUrl: ''
    });

    return helperFactory(this._assetMap, opts);
  }

}
