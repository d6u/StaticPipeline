#!/usr/bin/env node

'use strict';

var path = require('path');
var StaticPipeline = require('../dist');
var configBlock = require(path.resolve('Staticfile'));

new StaticPipeline().config(configBlock).run();
