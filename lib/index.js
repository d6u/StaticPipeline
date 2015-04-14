'use strict';

import * as Bluebird from 'bluebird';
import Task from './task';
import {
  TaskNotFoundError,
  CircularDependencyError
} from './errors';

export function resolveTaskDependencies(config) {
  let tasks = Object.keys(config).filter(key => key[0] !== '_');
  var remainingTasks = tasks.slice(0);
  var queue = [];

  function fillQueue(task, dependings) {
    if (tasks.indexOf(task) === -1) {
      throw new TaskNotFoundError(task);
    }

    if (dependings.indexOf(task) > -1) {
      throw new CircularDependencyError(dependings);
    }

    if (queue.indexOf(task) === -1) {
      let deps = config[task].depends;
      if (deps) {
        deps.forEach(dep => fillQueue(dep, dependings.concat([task])));
      }
      var i = remainingTasks.indexOf(task);
      remainingTasks.splice(i, 1);
      queue.push(task);
    }
  }

  while (remainingTasks.length) {
    fillQueue(remainingTasks[0], []);
  }

  return queue;
}

export default class StaticPipeline {
  constructor() {
    this.tasks = null;
    this.assetsDict = {};
  }

  config(configBlock) {
    var configObj = {};
    configBlock(configObj);
    this.tasks = configObj.tasks;
  }

  run() {
    return Bluebird.try(() => {
      var queue = resolveTaskDependencies(this.config);
      return Bluebird.resolve(queue).each(taskName => new Task(this.config[taskName]).run());
    });
  }
}
