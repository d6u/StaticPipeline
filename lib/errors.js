'use strict';

function FileNotFoundError(file) {
  this.file = file;
  this.message = this.file + ' cannot be found.'
  this.name = 'FileNotFoundError';
  Error.captureStackTrace(this, FileNotFoundError);
}

FileNotFoundError.prototype = Object.create(Error.prototype);
FileNotFoundError.prototype.constructor = FileNotFoundError;

function AssetNotFoundError(url) {
  this.url = url;
  this.message = this.url + ' cannot be found.'
  this.name = 'AssetNotFoundError';
  Error.captureStackTrace(this, AssetNotFoundError);
}

AssetNotFoundError.prototype = Object.create(Error.prototype);
AssetNotFoundError.prototype.constructor = AssetNotFoundError;

function TaskNotFoundError(task) {
  this.task = task;
  this.message = this.task + ' cannot be found.'
  this.name = 'TaskNotFoundError';
  Error.captureStackTrace(this, TaskNotFoundError);
}

TaskNotFoundError.prototype = Object.create(Error.prototype);
TaskNotFoundError.prototype.constructor = TaskNotFoundError;

function CircularDependencyError(tasks) {
  this.tasks = tasks;
  this.message = 'Tasks "' + tasks.join('", "') + '" are having a circular dependency.';
  this.name = 'CircularDependencyError';
  Error.captureStackTrace(this, CircularDependencyError);
}

CircularDependencyError.prototype = Object.create(Error.prototype);
CircularDependencyError.prototype.constructor = CircularDependencyError;

module.exports = {
  FileNotFoundError: FileNotFoundError,
  AssetNotFoundError: AssetNotFoundError,
  TaskNotFoundError: TaskNotFoundError,
  CircularDependencyError: CircularDependencyError
};
