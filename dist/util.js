/*eslint no-console:0 no-process-exit:0*/

'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.resolveTaskDependencies = resolveTaskDependencies;
exports.mkdir = mkdir;
exports.writeFile = writeFile;
exports.createLogger = createLogger;
exports.throwError = throwError;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _promisified = require('./promisified');

var _errors = require('./errors');

var _join = Array.prototype.join;

/**
 * Take formated task config object and return an array with tasks orderred
 * by their dependency graph
 * @param {Object} config - Object with each key as taskName and each value's
 *                         `depends` property as indicator of dependency
 * @param {string} [target] - A target task name. If provided, will resolve
 *                          dependencies only for target task.
 * @returns {string[]} Array of taskNames
 */

function resolveTaskDependencies(config, target) {
  var tasks = _Object$keys(config);
  var remainingTasks = tasks.slice(0);
  var queue = [];

  function fillQueue(task, dependings) {
    if (tasks.indexOf(task) === -1) {
      throw new _errors.TaskNotFoundError(task);
    }

    if (dependings.indexOf(task) > -1) {
      throw new _errors.CircularDependencyError(dependings);
    }

    if (queue.indexOf(task) === -1) {
      var deps = config[task].depends;
      if (deps) {
        deps.forEach(function (dep) {
          return fillQueue(dep, dependings.concat([task]));
        });
      }
      var i = remainingTasks.indexOf(task);
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

function mkdir(dirname) {
  return _promisified.fs.mkdirAsync(dirname).error(function (err) {
    if (err.cause.code === 'ENOENT') {
      return mkdir(_path2['default'].dirname(dirname)).then(function () {
        return _promisified.fs.mkdirAsync(dirname);
      });
    }
    throw err;
  });
}

function writeFile(filename, data, callback) {
  return _promisified.fs.writeFileAsync(filename, data).error(function (err) {
    if (err.cause.code === 'ENOENT') {
      return mkdir(_path2['default'].dirname(filename)).then(function () {
        return _promisified.fs.writeFileAsync(filename, data);
      });
    }
    throw err;
  }).nodeify(callback);
}

function createLogger(name) {
  var prefix = '[' + _chalk2['default'].blue(name) + ']';
  return function () {
    console.log(prefix + ' ' + _join.call(arguments, ' '));
  };
}

function throwError(err) {
  console.log(err.stack);
  process.exit(1);
}