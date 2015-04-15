'use strict';

import Bluebird from 'bluebird';
import path from 'path';
import url from 'url';
import { glob, fs, exec } from './promisified';
import {
  FileNotFoundError,
  AssetNotFoundError,
  TaskNotFoundError,
  CircularDependencyError
} from './errors';

let EXT_REGEX = /\.[a-z0-9]+$/i;
let GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
let STAT_REGEX = /(\d+)-(\w+)/;

export function mkdir(dirname) {
  return fs.mkdirAsync(dirname)
    .error(function (err) {
      if (err.cause.code === 'ENOENT') {
        return mkdir(path.dirname(dirname))
          .then(function () {
            return fs.mkdirAsync(dirname);
          });
      }
      throw err;
    });
}

export function writeFile(filename, data, cb) {
  return fs.writeFileAsync(filename, data)
    .error(function (err) {
      if (err.cause.code === 'ENOENT') {
        return mkdir(path.dirname(filename))
          .then(function () {
            return fs.writeFileAsync(filename, data);
          });
      }
      throw err;
    })
    .tap(cb);
}

export function parseGitHash(file) {
  return exec(GIT_HASH_CMD + file)
    .spread(function (stdout) {
      var m = STAT_REGEX.exec(stdout);
      return {timestamp: m[1], hash: m[2]};
    });
}

export default class Task {
  constructor(config) {
    this.config = config;
  }

  run() {
    if (!this.config.files) {
      return this.config.process.call({
        assets: this.assets.bind(this),
        writeFile: writeFile,
        fsAsync: fs,
        Promise: Bluebird
      });
    }

    return Bluebird.all(this.config.files)
      .bind(this)
      .map(function (fileDef) {
        if (!fileDef.base) {
          var src = path.resolve(fileDef.src);
          return glob(src)
            .then(function (files) {
              if (!files.length) {
                throw new FileNotFoundError(src);
              }
              return [{
                src: files[0],
                dest: path.resolve(fileDef.dest)
              }];
            });
        }
        return glob(path.resolve(fileDef.base, fileDef.src))
          .map(function (file) {
            var dest = file.replace(path.resolve(fileDef.base), path.resolve(fileDef.dest));

            if (fileDef.ext) {
              dest = dest.replace(EXT_REGEX, '.' + fileDef.ext);
            }

            return {
              src: file,
              dest: dest
            };
          });
      })
      .then(function (pathPairsArr) {
        var arr = [];
        for (var i = 0; i < pathPairsArr.length; i++) {
          arr = arr.concat(pathPairsArr[i]);
        }
        return arr; // Array of src-dest path pair
      })
      .each(function (pair) {
        return Bluebird.fromNode(function (cb) {
          var p = this.config.process.call({
            assets: this.assets.bind(this),
            gitHash: this.gitHashFactory(pair),
            writeFile: this.writeFile.bind(this),
            fsAsync: fs,
            Promise: Bluebird
          }, pair.src, pair.dest, cb);

          if (p && p.then) {
            p.then(cb);
          }
        });
      })
      .return(null);
  }

  /**
   * Make function that obtains git commit hash for file or array of files.
   * @param  {Object} pair
   * @param  {string} pair.src
   * @param  {string} pair.dest
   * @return {Function}
   */
  gitHashFactory(pair) {
    /**
     * Obtain git commit hash for file or array of files. It will also add to assetsDict a key of dest url relative to
     * _publicBase defined in config, with of hashed dest url relative to _publicBase.
     *
     * @param  {undefined|string|string[]} files - if undefined, it will use pair.src to obtain git hash;
     *                                             if string, it will string as a path to obtain git hash;
     *                                             if string[], it will obtain hash for each file in array, and use the
     *                                             latest one.
     * @param  {Function} cb - if provided, cb will be called with git hash.
     * @return {Promise} - resolve with dest file path appended with git hash.
     */
    return function (files, cb) {
      var p;
      if (!files) {
        p = parseGitHash(pair.src);
      } else if (typeof files === 'string') {
        p = parseGitHash(files);
      } else {
        p = Bluebird.all(files)
          .map(function (file) {
            return parseGitHash(file);
          })
          .reduce(function (h, cur) {
            return h.timestamp > cur.timestamp ? h : cur;
          });
      }
      return p.bind(this)
        .then(function (h) {
          var finalDest = pair.dest.replace(EXT_REGEX, '-' + h.hash + '$&'),
            unhashedUrl = pair.dest.replace(path.resolve(this.config._publicBase), ''),
            hashedUrl = finalDest.replace(path.resolve(this.config._publicBase), '');

          if (this.config._newBase) {
            hashedUrl = url.resolve(this.config._newBase, hashedUrl);
          }

          this.assetsDict[unhashedUrl] = hashedUrl;
          return finalDest;
        })
        .tap(cb);
    }.bind(this);
  }

  assets(url) {
    if (!url) {
      return this.assetsDict;
    }
    var result = this.assetsDict[url];
    if (!result) {
      if (this.config._strict) {
        throw new AssetNotFoundError(url);
      } else {
        return url;
      }
    }
    return result;
  }
}
