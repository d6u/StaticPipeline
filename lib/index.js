import Bluebird from 'bluebird';
import path from 'path';
import assign from 'lodash/object/assign';
import difference from 'lodash/array/difference';
import chalk from 'chalk';
import chokidar from 'chokidar';
import crypto from 'crypto';
import { writeFile, resolveTaskDependencies, createLogger, throwError } from './util';
import { ConfigNotFoundError } from './errors';
import helperFactory from './helper-factory';
import resolveFile from './resolve-file';
import gitHashFactory from './git-hash-factory';
import WatchMap from './watch-map';

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

const noop = function () {};

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
      this._watcherMap = new WatchMap();

      this._watcher = chokidar.watch(null, {
        persistent: true
      });

      this._watcher.on('change', path => this._fileChanged(path));
      this._watcher.on('unlink', path => this._fileRemoved(path));
    } else {
      this._watcher = null;
    }
  }

  start(target) {
    return this._run(target);
  }

  async _run(target) {
    let queue = resolveTaskDependencies(this.tasks, target);

    for (let task of queue) {
      await this._runTask(task);
    }
  }

  async _runTask(taskName) {
    let task = this.tasks[taskName];
    let log = this.opts.logging ? createLogger(taskName) : noop;

    log('task start');

    if (!task.files) {
      await this._dispatchTask({}, task.process, { log, taskName, isGlob: false });

    } else {
      for (let file of task.files) {

        let fileObjs;

        try {
          fileObjs = await resolveFile(file, {
            workingDir: this.opts.workingDir
          });
        } catch (err) {
          throwError(err);
        }

        let isGlob = typeof file.base !== 'undefined';

        for (let fileObj of fileObjs) {
          await this._dispatchTask(fileObj, task.process, { log, taskName, isGlob });
        }
      }
    }
  }

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
  async _dispatchTask(fileObj, taskProcess, opts) {
    let self = this;

    async function runBlock() {
      let watchList = await self._processTask(fileObj, taskProcess, {
        log: opts.log
      });

      if (self.opts.watching && watchList.length) {
        self._updateWatchTask(opts.taskName, `${fileObj.src}`, watchList, runBlock, {
          isGlob: opts.isGlob
        });
      }
    }

    await runBlock();
  }

  /**
   * Actually invoke the taskProcess function.
   * @param  {Object}      fileObj       An object with src and dest path
   * @param  {string}      fileObj.src   Source file
   * @param  {string}      fileObj.dest  Destination file
   * @param  {taskProcess} processBlock  Function defined to actually execute tasks
   * @param  {Object}      opts          Additional objects to run current `process` block
   * @param  {Function}    opts.log      A log function with current task name as console prefix
   * @return {string[]}                  A list of path to watch changes for
   */
  async _processTask(fileObj, processBlock, opts) {
    let self = this;
    let watchList = fileObj.src ? [fileObj.src] : [];
    let watched = false;

    await Bluebird.fromNode(function (resolver) {

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

          watched = true;

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

    return watched ? watchList : [];
  }

  /**
   * Add / romove files to the watcher
   * @param  {string}   taskName    Task name
   * @param  {string}   fileKey     Entry src file path
   * @param  {string[]} files       A list of file belongs to current runBlock
   * @param  {Function} runBlock    An async function to invoke the underlying build process.
   * @param  {Object}   opts        Additional options
   * @param  {bool}     opts.isGlob Indicate if this fileKey is generated based on a glob pattern.
   * @return {void}
   */
  _updateWatchTask(taskName, fileKey, files, runBlock, opts) {

    if (!this._watcherMap.has(taskName, fileKey)) {

      this._watcherMap.put(taskName, fileKey, {
        files: files,
        runBlock: runBlock,
        glob: opts.glob
      });

      this._watcher.add(files);

    } else {

      let curFiles = this._watcherMap.get(taskName, fileKey).files;
      let newFiles = difference(files, curFiles);
      let oldFiles = difference(curFiles, files);

      let shared = false;

      for (let file of oldFiles) {

        for (let [task, srcFile, detail] of this._watcherMap) {
          if (task === taskName && srcFile === fileKey) continue;

          if (detail.files.indexOf(file) > -1) {
            shared = true;
            break;
          }
        }

        if (!shared) this._watcher.unwatch(file);
      }

      this._watcher.add(newFiles);

      this._watcherMap.get(taskName, fileKey).files = files;
    }
  }

  async _fileChanged(file) {
    let found = false;

    for (let [,, detail] of this._watcherMap) {
      if (detail.files.indexOf(file) > -1) {
        found = true;

        await detail.runBlock();
      }
    }

    if (!found) {
      throw new Error(`Cannot find related task for ${file}`);
    }
  }

  _fileRemoved(file) {
    for (let [task, srcFile, detail] of this._watcherMap) {
      if (srcFile === file) {
        if (!detail.isGlob) {
          throw new Error('Not globbed path should not be removed.');
        }

        this._updateWatchTask(task, srcFile, [], detail.runBlock);

      } else if (detail.files.indexOf(file) > -1) {
        let filesLeft = difference(detail.files, [file]);
        this._updateWatchTask(task, srcFile, filesLeft, detail.runBlock);
      }
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
