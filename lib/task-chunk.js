'use strict';

var path = require('path');
var url = require('url');
var Bluebird = require('bluebird');
var execAsync = Bluebird.promisify(require('child_process').exec);
var fs = Bluebird.promisifyAll(require('fs'));
var globAsync = require('./promisified-glob');
var Errors = require('./errors');

var EXT_REGEX = /\.[a-z0-9]+$/i;
var GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
var STAT_REGEX = /(\d+)-(\w+)/;

function TaskChunk(config) {
  this.config = config;
  this.assetsDict = {};
}

TaskChunk.prototype.run = function () {
  var self = this;
  return Bluebird.try(function () {
    var taskNames = Object.keys(self.config)
      .filter(function (key) {
        return key[0] !== '_';
      });

    var allTaskNames = taskNames.slice(0), queue = [];

    /**
     * @param  {string}   taskName   - Current task that tries to resolve dependencies
     * @param  {string[]} dependings - Chain of tasks that depends on current task
     */
    function fillQueue(taskName, dependings) {
      if (allTaskNames.indexOf(taskName) === -1) {
        throw new Errors.TaskNotFoundError(taskName);
      }

      if (dependings.indexOf(taskName) > -1) {
        throw new Errors.CircularDependencyError(dependings);
      }

      if (queue.indexOf(taskName) === -1) {
        var deps = self.config[taskName].depends;
        if (deps) {
          deps.forEach(function (dep) {
            fillQueue(dep, dependings.concat([taskName]));
          });
        }
        var i = taskNames.indexOf(taskName);
        taskNames.splice(i, 1);
        queue.push(taskName);
      }
    }

    while (taskNames.length) {
      fillQueue(taskNames[0], []);
    }

    return Bluebird.resolve(queue)
      .each(function (taskName) {
        return self.runTask(taskName);
      });
  });
};

TaskChunk.prototype.runTask = function (taskName) {
  if (!this.config[taskName].files) {
    return this.config[taskName].process.call({
      assets: this.assets.bind(this),
      writeFile: this.writeFile.bind(this),
      fsAsync: fs,
      Promise: Bluebird
    });
  }

  return Bluebird.all(this.config[taskName].files)
    .bind(this)
    .map(function (fileDef) {
      if (!fileDef.base) {
        var src = path.resolve(fileDef.src);
        return globAsync(src)
          .then(function (files) {
            if (!files.length) {
              throw new Errors.FileNotFoundError(src);
            }
            return [{
              src: files[0],
              dest: path.resolve(fileDef.dest)
            }];
          });
      }
      return globAsync(path.resolve(fileDef.base, fileDef.src))
        .map(function (file) {
          var dest = file.replace(path.resolve(fileDef.base), path.resolve(fileDef.dest));

          if (fileDef.ext) {
            dest = dest.replace(EXT_REGEX, '.' + fileDef.ext);
          }

          return {
            src: file,
            dest: dest
          };
        });
    })
    .then(function (pathPairsArr) {
      var arr = [];
      for (var i = 0; i < pathPairsArr.length; i++) {
        arr = arr.concat(pathPairsArr[i]);
      }
      return arr; // Array of src-dest path pair
    })
    .each(function (pair) {
      return this.config[taskName].process.call({
        assets: this.assets.bind(this),
        gitHash: this.gitHashFactory(pair),
        writeFile: this.writeFile.bind(this),
        fsAsync: fs,
        Promise: Bluebird
      }, pair.src, pair.dest);
    })
    .return(null);
};

TaskChunk.prototype.mkdir = function (dirname, cb) {
  return fs.mkdirAsync(dirname)
    .bind(this)
    .error(function (err) {
      if (err.cause.code === 'ENOENT') {
        return this.mkdir(path.dirname(dirname))
          .then(function () {
            return fs.mkdirAsync(dirname).bind(this);
          });
      }
      throw err;
    });
}

TaskChunk.prototype.writeFile = function (filename, data, cb) {
  return fs.writeFileAsync(filename, data)
    .bind(this)
    .error(function (err) {
      if (err.cause.code === 'ENOENT') {
        return this.mkdir(path.dirname(filename))
          .then(function () {
            return fs.writeFileAsync(filename, data).bind(this);
          });
      }
      throw err;
    });
}

function parseGitHash(file) {
  return execAsync(GIT_HASH_CMD + file)
    .spread(function (stdout) {
      var m = STAT_REGEX.exec(stdout);
      return {timestamp: m[1], hash: m[2]};
    });
}

/**
 * Make function that obtains git commit hash for file or array of files.
 * @param  {Object} pair
 * @param  {string} pair.src
 * @param  {string} pair.dest
 * @return {Function}
 */
TaskChunk.prototype.gitHashFactory = function (pair) {
  /**
   * Obtain git commit hash for file or array of files. It will also add to assetsDict a key of dest url relative to
   * _publicBase defined in config, with of hashed dest url relative to _publicBase.
   *
   * @param  {undefined|string|string[]} files - if undefined, it will use pair.src to obtain git hash;
   *                                             if string, it will string as a path to obtain git hash;
   *                                             if string[], it will obtain hash for each file in array, and use the
   *                                             latest one.
   * @return {Promise} - resolve with dest file path appended with git hash.
   */
  return function (files) {
    var p;
    if (!files) {
      p = parseGitHash(pair.src);
    } else if (typeof files === 'string') {
      p = parseGitHash(files);
    } else {
      p = Bluebird.all(files)
        .map(function (file) {
          return parseGitHash(file)
        })
        .reduce(function (h, cur) {
          return h.timestamp > cur.timestamp ? h : cur;
        });
    }
    return p.bind(this)
      .then(function (h) {
        var finalDest = pair.dest.replace(EXT_REGEX, '-' + h.hash + '$&'),
          unhashedUrl = pair.dest.replace(path.resolve(this.config._publicBase), ''),
          hashedUrl = finalDest.replace(path.resolve(this.config._publicBase), '');

        if (this.config._newBase) {
          hashedUrl = url.resolve(this.config._newBase, hashedUrl);
        }

        this.assetsDict[unhashedUrl] = hashedUrl;
        return finalDest;
      });
  }.bind(this);
};

TaskChunk.prototype.assets = function (url) {
  if (!url) {
    return this.assetsDict;
  }
  var result = this.assetsDict[url];
  if (!result) {
    if (this.config._strict) {
      throw new Errors.AssetNotFoundError(url);
    } else {
      return url;
    }
  }
  return result;
};

module.exports = TaskChunk;
