/*eslint no-console:0*/

import path from 'path';
import chalk from 'chalk';
import { fs } from './promisified';
import { TaskNotFoundError, CircularDependencyError } from './errors';

const _join = Array.prototype.join;

/**
 * Take formated task config object and return an array with tasks orderred
 * by their dependency graph
 * @param {Object} config - Object with each key as taskName and each value's
 *                         `depends` property as indicator of dependency
 * @param {string} [target] - A target task name. If provided, will resolve
 *                          dependencies only for target task.
 * @returns {string[]} Array of taskNames
 */
export function resolveTaskDependencies(config, target) {
  let tasks = Object.keys(config);
  let remainingTasks = tasks.slice(0);
  let queue = [];

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
      let i = remainingTasks.indexOf(task);
      remainingTasks.splice(i, 1);
      queue.push(task);
    }
  }

  if (target) {
    fillQueue(target, []);
  } else {
    while (remainingTasks.length) {
      fillQueue(remainingTasks[0], []);
    }
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

export function createLogger(name) {
  let prefix = `[${chalk.blue(name)}]`;
  return function () {
    console.log(`${prefix} ${_join.call(arguments, ' ')}`);
  };
}
