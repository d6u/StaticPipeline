'use strict';

import Bluebird from 'bluebird';
import path from 'path';
import Task from './task';
import { resolveTaskDependencies } from './util';
import { AssetNotFoundError, ConfigNotFoundError } from './errors';
import assign from 'lodash/object/assign';

const DEFAULT_OPTS = {
  logging:     false,
  disableHash: false,
  assets: {
    useMap:    true,
    forceMap:  false,
    publicDir: null,
    baseUrl:   ''
  }
};

export default class StaticPipeline {

  /**
   * StaticPipeline configuration callbacks
   * @callback configBlock
   * @param {Object} config - Whose `options` and `tasks` properties will be picked up by StaticPipeline to configure itself.
   */

  /**
   * @param {Object} opts
   * @param {configBlock} opts.configBlock - A function used to provide configurations to StaticPipeline instance
   */
  constructor(opts) {
    this.tasks = [];
    this.opts = {};
    this.assetsMap = {};
    this._configTasks(opts.configBlock);
  }

  _configTasks(configBlock) {
    var configObj = {};

    configBlock(configObj);

    this.tasks = configObj.tasks;
    this.opts = assign({}, DEFAULT_OPTS, configObj.options);

    return this;
  }

  setAsset(dest, hashedDest) {
    if (this.opts.assets.publicDir == null) {
      throw new ConfigNotFoundError('assets.publicDir');
    }
    let base = path.resolve(this.opts.assets.publicDir);
    let newBase = (this.opts.assets.baseUrl || '').replace(/\/$/, '');
    let url = dest.replace(base, '');
    let hashedUrl = hashedDest.replace(base, newBase);
    this.assetsMap[url] = hashedUrl;
  }

  assets(url) {
    if (!url) return this.assetsMap;
    if (this.opts.assets.useMap) {
      let hashedUrl = this.assetsMap[url];
      if (hashedUrl) {
        return hashedUrl;
      } else if (this.opts.assets.forceMap) {
        throw new AssetNotFoundError(url);
      }
    }
    return url;
  }

  run() {
    return Bluebird.try(() => {
      var queue = resolveTaskDependencies(this.tasks);
      return Bluebird.resolve(queue).each( taskName =>
        new Task(taskName, this.tasks[taskName], this).run()
      );
    });
  }
}
