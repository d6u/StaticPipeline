#!/usr/bin/env node

var path = require('path');
var assign = require('lodash/object/assign');
var StaticPipeline = require('../dist');
var configBlock = require(path.resolve('Staticfile'));

var DEFAULT_OPTS = {
  logging: true
};

var config = {};

var options;

configBlock(config);

options = assign({}, DEFAULT_OPTS, config.options);

new StaticPipeline(config.tasks, options).start();
