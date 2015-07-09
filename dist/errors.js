'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var FileNotFoundError = (function (_Error) {
  function FileNotFoundError(file) {
    _classCallCheck(this, FileNotFoundError);

    _get(Object.getPrototypeOf(FileNotFoundError.prototype), 'constructor', this).call(this);
    this.file = file;
    this.message = this.file + ' cannot be found.';
    this.name = 'FileNotFoundError';
    Error.captureStackTrace(this, FileNotFoundError);
  }

  _inherits(FileNotFoundError, _Error);

  return FileNotFoundError;
})(Error);

exports.FileNotFoundError = FileNotFoundError;

var AssetNotFoundError = (function (_Error2) {
  function AssetNotFoundError(url) {
    _classCallCheck(this, AssetNotFoundError);

    _get(Object.getPrototypeOf(AssetNotFoundError.prototype), 'constructor', this).call(this);
    this.url = url;
    this.message = this.url + ' cannot be found.';
    this.name = 'AssetNotFoundError';
    Error.captureStackTrace(this, AssetNotFoundError);
  }

  _inherits(AssetNotFoundError, _Error2);

  return AssetNotFoundError;
})(Error);

exports.AssetNotFoundError = AssetNotFoundError;

var TaskNotFoundError = (function (_Error3) {
  function TaskNotFoundError(task) {
    _classCallCheck(this, TaskNotFoundError);

    _get(Object.getPrototypeOf(TaskNotFoundError.prototype), 'constructor', this).call(this);
    this.task = task;
    this.message = this.task + ' cannot be found.';
    this.name = 'TaskNotFoundError';
    Error.captureStackTrace(this, TaskNotFoundError);
  }

  _inherits(TaskNotFoundError, _Error3);

  return TaskNotFoundError;
})(Error);

exports.TaskNotFoundError = TaskNotFoundError;

var CircularDependencyError = (function (_Error4) {
  function CircularDependencyError(tasks) {
    _classCallCheck(this, CircularDependencyError);

    _get(Object.getPrototypeOf(CircularDependencyError.prototype), 'constructor', this).call(this);
    this.tasks = tasks;
    this.message = 'Tasks "' + tasks.join('", "') + '" are having a circular dependency.';
    this.name = 'CircularDependencyError';
    Error.captureStackTrace(this, CircularDependencyError);
  }

  _inherits(CircularDependencyError, _Error4);

  return CircularDependencyError;
})(Error);

exports.CircularDependencyError = CircularDependencyError;

var ConfigNotFoundError = (function (_Error5) {
  function ConfigNotFoundError(configName) {
    _classCallCheck(this, ConfigNotFoundError);

    _get(Object.getPrototypeOf(ConfigNotFoundError.prototype), 'constructor', this).call(this);
    this.configName = configName;
    this.message = 'Configuration "' + this.configName + '" cannot be found.';
    this.name = 'ConfigNotFoundError';
    Error.captureStackTrace(this, ConfigNotFoundError);
  }

  _inherits(ConfigNotFoundError, _Error5);

  return ConfigNotFoundError;
})(Error);

exports.ConfigNotFoundError = ConfigNotFoundError;