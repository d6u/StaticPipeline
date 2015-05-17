'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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