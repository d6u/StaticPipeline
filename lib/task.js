'use strict';

import Bluebird from 'bluebird';
import path from 'path';
import url from 'url';
import crypto from 'crypto';
import { glob, fs, exec } from './promisified';
import {
  FileNotFoundError,
  AssetNotFoundError,
  TaskNotFoundError,
  CircularDependencyError
} from './errors';
import { writeFile, parseGitHash } from './util';

const EXT_REGEX = /\.[a-z0-9]+$/i;

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

  runProcess(pair) {
    return Bluebird.fromNode((finish) => {
      this.config.process({
        src: pair.src,
        dest: pair.dest,
        done(path, content) {
          if (!path && !content) {
            return finish();
          }
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
  }

  run() {
    this.resolveSrcDest().each(pair => this.runProcess(pair));
  }
}
