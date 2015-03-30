'use strict';

var TaskChunk = require('./task-chunk');

function staticPipeline(config) {
  var taskChunk = new TaskChunk(config);
  return taskChunk.run();
}

module.exports = staticPipeline;
