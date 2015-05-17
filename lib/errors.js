export class FileNotFoundError extends Error {
  constructor(file) {
    super();
    this.file = file;
    this.message = this.file + ' cannot be found.';
    this.name = 'FileNotFoundError';
    Error.captureStackTrace(this, FileNotFoundError);
  }
}

export class AssetNotFoundError extends Error {
  constructor(url) {
    super();
    this.url = url;
    this.message = this.url + ' cannot be found.';
    this.name = 'AssetNotFoundError';
    Error.captureStackTrace(this, AssetNotFoundError);
  }
}

export class TaskNotFoundError extends Error {
  constructor(task) {
    super();
    this.task = task;
    this.message = this.task + ' cannot be found.';
    this.name = 'TaskNotFoundError';
    Error.captureStackTrace(this, TaskNotFoundError);
  }
}

export class CircularDependencyError extends Error {
  constructor(tasks) {
    super();
    this.tasks = tasks;
    this.message = 'Tasks "' + tasks.join('", "') + '" are having a circular dependency.';
    this.name = 'CircularDependencyError';
    Error.captureStackTrace(this, CircularDependencyError);
  }
}

export class ConfigNotFoundError extends Error {
  constructor(configName) {
    super();
    this.configName = configName;
    this.message = `Configuration "${this.configName}" cannot be found.`;
    this.name = 'ConfigNotFoundError';
    Error.captureStackTrace(this, ConfigNotFoundError);
  }
}
