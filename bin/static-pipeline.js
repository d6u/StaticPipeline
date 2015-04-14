#!/usr/bin/env node

'use strict';

var path = require('path');
var StaticPipeline = require('../lib');
var config = require(path.resolve('Staticfiles'));

new StaticPipeline(config).run();
