'use strict';

var AssetNotFoundError = require('./dist/errors').AssetNotFoundError;

/**
 * Generate template helpers
 * @param  {Object} assetMap - A dictionary contains mapping between url and hashed url
 * @param  {Object} [opts]
 * @param  {bool} [opts.strict=true] - When true, throw error if no match found in assetMap
 * @param  {string} [opts.host=''] - A string to prepend before hashed url
 * @return {Function}
 */
module.exports = function (assetMap, opts) {
  var newMap;
  var keys;
  var i;

  opts = opts || {};

  if (typeof opts.strict === 'undefined') opts.strict = true;

  if (opts.host) {
    newMap = {};
    keys = Object.keys(assetMap);
    for (i = keys.length - 1; i >= 0 ; i--) {
      newMap[keys[i]] = opts.host + assetMap[keys[i]];
    }
    assetMap = newMap;
  }

  /**
   * Template helpers to translate url into hashed url
   * @param  {String} url
   * @return {String} Hashed url
   */
  return function (url) {
    if (!url) return;
    var hashedUrl = assetMap[url];
    if (hashedUrl) {
      return hashedUrl;
    } else if (opts.strict) {
      throw new AssetNotFoundError(url);
    }
    return url;
  };
};
