'use strict';

var glob = require('glob');
var Bluebird = require('bluebird');

module.exports = Bluebird.promisify(glob);
