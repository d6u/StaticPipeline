'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.parseGitHash = parseGitHash;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _promisified = require('./promisified');

var GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
var STAT_REGEX = /(\d+)-(\w+)/;
var EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

require('babel/polyfill');

function parseGitHash(file) {
  return (0, _promisified.exec)('' + GIT_HASH_CMD + '' + file).spread(function (stdout, stderr) {
    var m = STAT_REGEX.exec(stdout);
    if (m) return { timestamp: m[1], hash: m[2] };
    throw new Error('failed to get git hash - stdout: ' + stdout + ', stderr: ' + stderr);
  });
}

/**
 * Curry gitHash function
 *
 * @param  {Object} opts - Configuration
 * @param  {string} opts.dest - The path to append hash
 * @param  {string} opts.src - If the default path to look for git commit hash
 * @param  {bool} [opts.disable=false] - If true, won't add any hash
 * @returns {Function}
 */

exports['default'] = function (opts) {

  /**
   * @callback gitHashCallback
   * @param {Error} err - Error data
   * @param {Object} result - Result of gitHash
   * @param {Object} result.hash - The hash value
   * @param {Object} result.hashedDest - Dest path with hash appended
   */

  /**
   * Parse git commit hash
   * @param  {string|string[]} [files] - Single or multiple file path to read git commit hash
   * @param  {gitHashCallback} callback - Called with finish
   * @returns {Promise} Resolve/reject with the same arguments of gitHashCallback
   */
  return function (files, callback) {
    if (!callback) {
      var _temp = [null, files];
      files = _temp[0];
      callback = _temp[1];
      _temp;
    }

    return _bluebird2['default'].coroutine(regeneratorRuntime.mark(function callee$2$0() {
      var result, i, current, hash, hashedDest;
      return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
        while (1) switch (context$3$0.prev = context$3$0.next) {
          case 0:
            if (!opts.disable) {
              context$3$0.next = 2;
              break;
            }

            return context$3$0.abrupt('return', {
              hash: null,
              hashedDest: opts.dest
            });

          case 2:
            result = undefined;

            if (files) {
              context$3$0.next = 9;
              break;
            }

            context$3$0.next = 6;
            return exports.parseGitHash(opts.src);

          case 6:
            result = context$3$0.sent;
            context$3$0.next = 27;
            break;

          case 9:
            if (!Array.isArray(files)) {
              context$3$0.next = 24;
              break;
            }

            context$3$0.next = 12;
            return exports.parseGitHash(files[0]);

          case 12:
            result = context$3$0.sent;
            i = 1;

          case 14:
            if (!(i < files.length)) {
              context$3$0.next = 22;
              break;
            }

            context$3$0.next = 17;
            return exports.parseGitHash(files[i]);

          case 17:
            current = context$3$0.sent;

            result = result.timestamp > current.timestamp ? result : current;

          case 19:
            i++;
            context$3$0.next = 14;
            break;

          case 22:
            context$3$0.next = 27;
            break;

          case 24:
            context$3$0.next = 26;
            return exports.parseGitHash(files);

          case 26:
            result = context$3$0.sent;

          case 27:
            hash = result.hash;
            hashedDest = opts.dest.replace(EXT_REGEX, '-' + hash + '$&');
            return context$3$0.abrupt('return', { hash: hash, hashedDest: hashedDest });

          case 30:
          case 'end':
            return context$3$0.stop();
        }
      }, callee$2$0, this);
    }))().nodeify(callback);
  };
};

// Prefix with exports for easy testing