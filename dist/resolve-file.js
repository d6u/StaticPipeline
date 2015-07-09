'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _promisified = require('./promisified');

var _errors = require('./errors');

var EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

/**
 * Translate file glob defination into objects with src, dest properties
 *
 * @param {Object} fileDef - Single file defination, contains file globbing
 *                           path manipulation instructions
 * @param {string} fileDef.src - The source path. By default this point
 *                               to a file. If `base` is defined, this can be a
 *                               glob pattern.
 * @param {string} fileDef.dest - The destination path. By default this is a
 *                                path of a file. If `base` is defined, it can
 *                                be a path of dir, the source path part after
 *                                `base` will be appended after this to assemble
 *                                a full path to a file.
 * @param {string} [fileDef.base] - Base directory to prepend to src. With
 *                                  `base` defined, `src` can be a glob pattern.
 * @param {string} [fileDef.ext] - New dest file extension. It will replace
 *                                 the existing file extension defined in `dest`
 *                                 path. Ignored if `base` is not defined.
 * @param {Object} opts - Additional options
 * @param {Object} opts.workingDir - Current working dir against which all
 *                                   relative paths are resolved.
 * @returns {Promise} Resolve to array of plain objects with `src` and `dest` properties.
 */

exports['default'] = function callee$0$0(fileDef, opts) {
  var results, _sourceGlob, _srcs, baseDir, destDir, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, srcRelative, src, dest, sourceGlob, srcs;

  return _regeneratorRuntime.async(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (!fileDef.base) {
          context$1$0.next = 28;
          break;
        }

        results = [];
        _sourceGlob = _path2['default'].resolve(opts.workingDir, fileDef.base, fileDef.src);
        context$1$0.next = 5;
        return _regeneratorRuntime.awrap((0, _promisified.glob)(_sourceGlob));

      case 5:
        _srcs = context$1$0.sent;
        baseDir = _path2['default'].resolve(opts.workingDir, fileDef.base);
        destDir = _path2['default'].resolve(opts.workingDir, fileDef.dest);
        _iteratorNormalCompletion = true;
        _didIteratorError = false;
        _iteratorError = undefined;
        context$1$0.prev = 11;

        for (_iterator = _getIterator(_srcs); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          srcRelative = _step.value;
          src = _path2['default'].resolve(opts.workingDir, srcRelative);
          dest = src.replace(baseDir, destDir);

          if (fileDef.ext) {
            dest = dest.replace(EXT_REGEX, '.' + fileDef.ext);
          }

          results.push({ src: src, dest: dest });
        }

        context$1$0.next = 19;
        break;

      case 15:
        context$1$0.prev = 15;
        context$1$0.t0 = context$1$0['catch'](11);
        _didIteratorError = true;
        _iteratorError = context$1$0.t0;

      case 19:
        context$1$0.prev = 19;
        context$1$0.prev = 20;

        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }

      case 22:
        context$1$0.prev = 22;

        if (!_didIteratorError) {
          context$1$0.next = 25;
          break;
        }

        throw _iteratorError;

      case 25:
        return context$1$0.finish(22);

      case 26:
        return context$1$0.finish(19);

      case 27:
        return context$1$0.abrupt('return', results);

      case 28:
        sourceGlob = _path2['default'].resolve(opts.workingDir, fileDef.src);
        context$1$0.next = 31;
        return _regeneratorRuntime.awrap((0, _promisified.glob)(sourceGlob));

      case 31:
        srcs = context$1$0.sent;

        if (srcs.length) {
          context$1$0.next = 34;
          break;
        }

        throw new _errors.FileNotFoundError(sourceGlob);

      case 34:
        return context$1$0.abrupt('return', [{
          src: _path2['default'].resolve(opts.workingDir, srcs[0]),
          dest: _path2['default'].resolve(opts.workingDir, fileDef.dest)
        }]);

      case 35:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[11, 15, 19, 27], [20,, 22, 26]]);
};

module.exports = exports['default'];