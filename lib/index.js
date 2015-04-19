'use strict';

import Bluebird from 'bluebird';
import Task from './task';
import { resolveTaskDependencies } from './util';

export default class StaticPipeline {
  constructor() {
    this.tasks = null;
    this.assetsDict = {};
  }

  config(configBlock) {
    var configObj = {};
    configBlock(configObj);
    this.tasks = configObj.tasks;
    return this;
  }

  run() {
    return Bluebird.try(() => {
      var queue = resolveTaskDependencies(this.tasks);
      return Bluebird.resolve(queue).each(taskName => new Task(this.tasks[taskName]).run());
    });
  }
}
