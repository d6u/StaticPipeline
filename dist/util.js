'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.resolveTaskDependencies = resolveTaskDependencies;
exports.mkdir = mkdir;
exports.writeFile = writeFile;
exports.parseGitHash = parseGitHash;
exports.createLogger = createLogger;

var _path = require('path');

var _path2 = _interopRequireWildcard(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireWildcard(_chalk);

var _glob$fs$exec = require('./promisified');

var _TaskNotFoundError$CircularDependencyError = require('./errors');

/*eslint no-console:0*/

'use strict';

var _join = Array.prototype.join;

var GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
var STAT_REGEX = /(\d+)-(\w+)/;

function resolveTaskDependencies(config) {
  var tasks = Object.keys(config).filter(function (key) {
    return key[0] !== '_';
  });
  var remainingTasks = tasks.slice(0);
  var queue = [];

  function fillQueue(task, dependings) {
    if (tasks.indexOf(task) === -1) {
      throw new _TaskNotFoundError$CircularDependencyError.TaskNotFoundError(task);
    }

    if (dependings.indexOf(task) > -1) {
      throw new _TaskNotFoundError$CircularDependencyError.CircularDependencyError(dependings);
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

  while (remainingTasks.length) {
    fillQueue(remainingTasks[0], []);
  }

  return queue;
}

function mkdir(dirname) {
  return _glob$fs$exec.fs.mkdirAsync(dirname).error(function (err) {
    if (err.cause.code === 'ENOENT') {
      return mkdir(_path2['default'].dirname(dirname)).then(function () {
        return _glob$fs$exec.fs.mkdirAsync(dirname);
      });
    }
    throw err;
  });
}

function writeFile(filename, data, callback) {
  return _glob$fs$exec.fs.writeFileAsync(filename, data).error(function (err) {
    if (err.cause.code === 'ENOENT') {
      return mkdir(_path2['default'].dirname(filename)).then(function () {
        return _glob$fs$exec.fs.writeFileAsync(filename, data);
      });
    }
    throw err;
  }).nodeify(callback);
}

function parseGitHash(file) {
  return _glob$fs$exec.exec('' + GIT_HASH_CMD + '' + file).spread(function (stdout, stderr) {
    var m = STAT_REGEX.exec(stdout);
    if (m) return { timestamp: m[1], hash: m[2] };else throw new Error('failed to get git hash - stdout: ' + stdout + ', stderr: ' + stderr);
  });
}

function createLogger(name) {
  var prefix = '[' + _chalk2['default'].blue(name) + ']';
  return function () {
    console.log('' + prefix + ' ' + _join.call(arguments, ' '));
  };
}