import Bluebird from 'bluebird';
import path from 'path';
import assign from 'lodash/object/assign';
import chalk from 'chalk';
import crypto from 'crypto';
import { glob } from './promisified';
import { writeFile, resolveTaskDependencies, createLogger, parseGitHash } from './util';
import { ConfigNotFoundError, FileNotFoundError } from './errors';
import helperFactory from './helper-factory';

require('babel/polyfill');

const DEFAULT_OPTS = {
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

const EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

export default class StaticPipeline {

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
  constructor(tasks, opts) {
    this.opts = assign({}, DEFAULT_OPTS, opts);
    this.tasks = tasks;
    this._assetMap = {};
  }

  start(target) {
    return Bluebird.coroutine(this._run.bind(this))(target);
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
      yield* this._processTask({}, task.process, {
        log: log
      });
      return;
    }

    for (let file of task.files) {
      let fileObjs = yield* this._resolveFile(file);

      for (let fileObj of fileObjs) {
        yield* this._processTask(fileObj, task.process, {
          log: log
        });
      }
    }
  }

  /**
   * Translate file glob defination into objects with src, dest properties
   * @param {Object} fileDef - Single file defination, contains file globbing
   *                         path manipulation instructions
   * @param {string} fileDef.src - The source path. By default this point
   *                             to a file. If `base` is defined, this can be a
   *                             glob pattern.
   * @param {string} fileDef.dest - The destination path. By default this is a
   *                              path of a file. If `base` is defined, it can
   *                              be a path of dir, the source path part after
   *                              `base` will be appended after this to assemble
   *                              a full path to a file.
   * @param {string} [fileDef.base] - Base directory to prepend to src. With
   *                                `base` defined, `src` can be a glob pattern.
   * @param {string} [fileDef.ext] - New dest file extension. It will replace
   *                               the existing file extension defined in `dest`
   *                               path. Ignored if `base` is not defined.
   * @returns {Object[]} Array of plain objects with src and dest properties.
   */
  * _resolveFile(fileDef) {
    if (fileDef.base) {
      let results = [];

      let sourceGlob = path.resolve(this.opts.workingDir, fileDef.base, fileDef.src);
      let srcs = yield glob(sourceGlob);

      let baseDir = path.resolve(this.opts.workingDir, fileDef.base);
      let destDir = path.resolve(this.opts.workingDir, fileDef.dest);

      for (let src of srcs) {
        let dest = src.replace(baseDir, destDir);

        if (fileDef.ext) {
          dest = dest.replace(EXT_REGEX, '.' + fileDef.ext);
        }

        results.push({ src, dest });
      }

      return results;
    }

    let sourceGlob = path.resolve(this.opts.workingDir, fileDef.src);
    let srcs = yield glob(sourceGlob);

    if (!srcs.length) {
      throw new FileNotFoundError(sourceGlob);
    }

    return [{
      src: srcs[0],
      dest: path.resolve(this.opts.workingDir, fileDef.dest)
    }];
  }

  * _processTask(fileObj, processBlock, opts) {
    yield Bluebird.fromNode((resolver) => {

      let self = this;
      let promiseQueue = [];

      let pipeline = {

        src: fileObj.src,
        dest: fileObj.dest,
        setAsset: this.setAsset.bind(this),
        assets: this.makeAssetHelper(),
        log: opts.log,

        done(path, content) {
          if (!path && !content) return resolver(null, promiseQueue);

          if (!content) {
            [content, path] = [path, fileObj.dest];
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

        gitHash(files, callback) {
          return Bluebird.coroutine(function* () {
            if (self.opts.disableHash) {
              return {
                hash: null,
                hashedDest: fileObj.dest
              };
            }

            if (!files) {
              return yield parseGitHash(fileObj.src);
            }

            if (Array.isArray(files)) {
              let lastest = yield parseGitHash(files[0]);

              for (let i = 1; i < files.length; i++) {
                let current = yield parseGitHash(files[i]);
                lastest = lastest.timestamp > current.timestamp ? lastest : current;
              }

              return lastest;
            }

            return yield parseGitHash(files);
          })()
          .then(function (h) {
            let hash = h.hash;
            let hashedDest = fileObj.dest.replace(EXT_REGEX, `-${hash}$&`);
            return { hash, hashedDest };
          })
          .nodeify(callback);
        }
      };

      processBlock(pipeline);
    })
    .all();
  }

  setAsset(dest, hashedDest) {
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
  makeAssetHelper() {

    // Remove baseUrl option, because we already set them when `setAsset`
    let opts = assign({}, this.opts.assets, {
      baseUrl: ''
    });

    return helperFactory(this._assetMap, opts);
  }

}
