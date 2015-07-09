import Bluebird from 'bluebird';
import { exec } from './promisified';

const GIT_HASH_CMD = 'git log --pretty="format:%ct-%H" -n 1 -- ';
const STAT_REGEX = /(\d+)-(\w+)/;
const EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

export function parseGitHash(file) {
  return exec(`${GIT_HASH_CMD}${file}`)
    .spread(function (stdout, stderr) {
      var m = STAT_REGEX.exec(stdout);
      if (m) {
        return {
          timestamp: m[1],
          hash: m[2]
        };
      }

      let msg = `failed to get git hash - stdout: ${stdout}; stderr: ${stderr}`;

      throw new Error(msg);
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
export default function (opts) {

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
      [files, callback] = [null, files];
    }

    return Bluebird.coroutine(function* () {
      if (opts.disable) {
        return {
          hash: null,
          hashedDest: opts.dest
        };
      }

      let result;

      if (!files) {

        // Prefix with exports for easy testing
        result = yield exports.parseGitHash(opts.src);

      } else if (Array.isArray(files)) {
        result = yield exports.parseGitHash(files[0]);

        for (let i = 1; i < files.length; i++) {
          let current = yield exports.parseGitHash(files[i]);
          result = result.timestamp > current.timestamp ? result : current;
        }

      } else {
        result = yield exports.parseGitHash(files);
      }

      let hash = result.hash;
      let hashedDest = opts.dest.replace(EXT_REGEX, `-${hash}$&`);

      return { hash, hashedDest };
    })().nodeify(callback);
  };
}
