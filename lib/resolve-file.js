import path from 'path';
import { glob } from './promisified';
import { FileNotFoundError } from './errors';

const EXT_REGEX = /(?:\.[a-z0-9]+)?$/i;

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
export default async function (fileDef, opts) {
  if (fileDef.base) {
    let results = [];

    let sourceGlob = path.resolve(opts.workingDir, fileDef.base, fileDef.src);
    let srcs = await glob(sourceGlob);

    let baseDir = path.resolve(opts.workingDir, fileDef.base);
    let destDir = path.resolve(opts.workingDir, fileDef.dest);

    for (let srcRelative of srcs) {
      let src = path.resolve(opts.workingDir, srcRelative);
      let dest = src.replace(baseDir, destDir);

      if (fileDef.ext) {
        dest = dest.replace(EXT_REGEX, '.' + fileDef.ext);
      }

      results.push({ src, dest });
    }

    return results;
  }

  let sourceGlob = path.resolve(opts.workingDir, fileDef.src);
  let srcs = await glob(sourceGlob);

  if (!srcs.length) {
    throw new FileNotFoundError(sourceGlob);
  }

  return [{
    src: path.resolve(opts.workingDir, srcs[0]),
    dest: path.resolve(opts.workingDir, fileDef.dest)
  }];
}
