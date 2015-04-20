'use strict';

import Bluebird from 'bluebird';
import path from 'path';
import Task from './task';
import { resolveTaskDependencies } from './util';
import { AssetNotFoundError, ConfigNotFoundError } from './errors';
import merge from 'lodash-node/modern/object/merge';

const DEFAULT_OPTS = {
  logging:     false,
  disableHash: false,
  assets: {
    useMap:    true,
    forceMap:  false,
    publicDir: null,
    baseUrl:   null
  }
};

export default class StaticPipeline {
  constructor() {
    this.tasks = [];
    this.opts = {};
    this.assetsMap = {};
  }

  config(configBlock) {
    var configObj = {};
    configBlock(configObj);
    this.tasks = configObj.tasks;

    this.opts = merge({}, DEFAULT_OPTS, configObj.options);
    this.opts.assets.useMap = typeof this.opts.assets.useMap === 'undefined' ? true : this.opts.assets.useMap;

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
