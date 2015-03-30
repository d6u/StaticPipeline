#!/usr/bin/env node

var path = require('path');
var staticPipeline = require('../lib');
var config = require(path.resolve('Staticfiles'));

staticPipeline(config);
