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

module.exports = {
  FileNotFoundError: FileNotFoundError,
  AssetNotFoundError: AssetNotFoundError
};
