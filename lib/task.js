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
import crypto from 'crypto';

const EXT_REGEX = /\.[a-z0-9]+$/i;
const GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
const STAT_REGEX = /(\d+)-(\w+)/;

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

export function writeFile(filename, data, callback) {
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
    .nodeify(callback);
}

export function parseGitHash(file) {
  return exec(GIT_HASH_CMD + file)
    .spread(function (stdout, stderr) {
      var m = STAT_REGEX.exec(stdout);
      if (m) return {timestamp: m[1], hash: m[2]};
      else throw new Error('failed to get git hash - stdout: ' + stdout + ', stderr: ' + stderr);
    });
}

export default class Task {
  constructor(config) {
    this.config = config;
    this.srcDestPairs = [];
  }

  resolveSrcDest() {
    return Bluebird
      .resolve(this.config.files || [])
      .map((def) => {
        if (def.base) {
          return glob(path.resolve(def.base, def.src)).map(function (src) {
            let dest = src.replace(path.resolve(def.base), path.resolve(def.dest));

            if (def.ext) {
              dest = dest.replace(EXT_REGEX, '.' + def.ext);
            }

            return {src, dest};
          });
        }
        let globPath = path.resolve(def.src);
        return glob(globPath).then(function (files) {
          if (!files.length) throw new FileNotFoundError(globPath);
          return [{src: files[0], dest: path.resolve(def.dest)}];
        });
      })
      .then((pathPairsArr) => {
        this.srcDestPairs = [];
        for (var i = 0; i < pathPairsArr.length; i++) {
          this.srcDestPairs = this.srcDestPairs.concat(pathPairsArr[i]);
        }
        return this.srcDestPairs.length ? this.srcDestPairs : [{}];
      });
  }

  run() {
    this.resolveSrcDest()
      .each((pair) => {
        return Bluebird.fromNode((finish) => {
          this.config.process({
            src: pair.src,
            dest: pair.dest,
            done(path, content) {
              if (!content) {
                content = path;
                path = pair.dest;
              }
              writeFile(path, content);
              finish();
            },
            write: writeFile,
            hash(str) {
              return crypto.createHash('md5').update(str).digest('hex');
            },
            gitHash(files, callback) {
              let p;
              if (!files) {
                p = parseGitHash(pair.src);
              } else if (Array.isArray(files)) {
                p = Bluebird.all(files)
                  .map( file => parseGitHash(file) )
                  .reduce((h, cur) => h.timestamp > cur.timestamp ? h : cur );
              } else {
                p = parseGitHash(files);
              }
              return p.nodeify(callback);
            }
          });
        });
      });
  }
}
