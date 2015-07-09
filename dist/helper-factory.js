'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var DEFAULT_OPTS = {
  disable: false,
  strict: true,
  baseUrl: ''
};

/**
 * Pass arguments to this function to generate a template helper. This is meant
 * to be required as part of a express application. The return value can be
 * assign to `app.locals` object so it can become a global helper in template.
 *
 * @param  {Object} assetMap - A dictionary contains mapping between url and
 *                           hashed url
 * @param  {Object} [options]
 * @param  {bool} [options.strict=true] - When true, throw error if no match
 *                                      found in assetMap
 * @param  {bool} [options.disable=false] - If true, will return passed in url
 *                                        directly
 * @param  {string} [options.baseUrl=''] - A string to prepend before hashed url
 * @returns {Function}
 */

exports['default'] = function (assetMap, options) {
  var opts = (0, _lodashObjectAssign2['default'])({}, DEFAULT_OPTS, options);
  var newMap = undefined;
  var keys = undefined;
  var i = undefined;

  if (opts.disable) {
    return function (url) {
      return url;
    };
  }

  if (opts.baseUrl) {
    newMap = {};
    keys = _Object$keys(assetMap);
    for (i = keys.length - 1; i >= 0; i--) {
      newMap[keys[i]] = opts.baseUrl + assetMap[keys[i]];
    }
    assetMap = newMap;
  }

  /**
   * Template helpers to translate url into hashed url
   * @param  {String} url - Original url to lookup
   * @return {String} Hashed url - url with hashed appended
   */
  return function (url) {
    if (!url) return assetMap;

    var hashedUrl = assetMap[url];

    if (hashedUrl) {
      return hashedUrl;
    } else if (opts.strict) {
      throw new _errors2['default'](url);
    }

    return url;
  };
};

module.exports = exports['default'];