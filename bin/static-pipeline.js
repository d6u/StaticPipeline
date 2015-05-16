#!/usr/bin/env node

var path = require('path');
var StaticPipeline = require('../dist');
var configBlock = require(path.resolve('Staticfile'));

var staticPipeline = new StaticPipeline().config(configBlock);
staticPipeline.opts.logging = true;
staticPipeline.run();
