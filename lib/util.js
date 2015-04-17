'use strict';

import path from 'path';
import { glob, fs, exec } from './promisified';

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
  return exec(`${GIT_HASH_CMD}${file}`)
    .spread(function (stdout, stderr) {
      var m = STAT_REGEX.exec(stdout);
      if (m) return {timestamp: m[1], hash: m[2]};
      else throw new Error(`failed to get git hash - stdout: ${stdout}, stderr: ${stderr}`);
    });
}
