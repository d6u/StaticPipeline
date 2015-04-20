/*eslint no-console:0*/

'use strict';

import path from 'path';
import chalk from 'chalk';
import { glob, fs, exec } from './promisified';
import {
  TaskNotFoundError,
  CircularDependencyError
} from './errors';

const GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
const STAT_REGEX = /(\d+)-(\w+)/;

export function resolveTaskDependencies(config) {
  let tasks = Object.keys(config).filter(key => key[0] !== '_');
  var remainingTasks = tasks.slice(0);
  var queue = [];

  function fillQueue(task, dependings) {
    if (tasks.indexOf(task) === -1) {
      throw new TaskNotFoundError(task);
    }

    if (dependings.indexOf(task) > -1) {
      throw new CircularDependencyError(dependings);
    }

    if (queue.indexOf(task) === -1) {
      let deps = config[task].depends;
      if (deps) {
        deps.forEach(dep => fillQueue(dep, dependings.concat([task])));
      }
      var i = remainingTasks.indexOf(task);
      remainingTasks.splice(i, 1);
      queue.push(task);
    }
  }

  while (remainingTasks.length) {
    fillQueue(remainingTasks[0], []);
  }

  return queue;
}

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

export function createLogger(name) {
  let prefix = `[${chalk.blue(name)}]`;
  return function (msg) {
    console.log(`${prefix} ${msg}`);
  };
}
