import assign from 'lodash/object/assign';
import AssetNotFoundError from './errors';

const DEFAULT_OPTS = {
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
export default function (assetMap, options) {
  let opts = assign({}, DEFAULT_OPTS, options);
  let newMap;
  let keys;
  let i;

  if (opts.disable) {
    return function (url) {
      return url;
    };
  }

  if (opts.baseUrl) {
    newMap = {};
    keys = Object.keys(assetMap);
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

    let hashedUrl = assetMap[url];

    if (hashedUrl) {
      return hashedUrl;
    } else if (opts.strict) {
      throw new AssetNotFoundError(url);
    }

    return url;
  };
}
