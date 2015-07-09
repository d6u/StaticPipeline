'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var glob = _bluebird2['default'].promisify(_glob2['default']);
exports.glob = glob;
var fs = _bluebird2['default'].promisifyAll(_fs2['default']);
exports.fs = fs;
var exec = _bluebird2['default'].promisify(_child_process.exec);
exports.exec = exec;