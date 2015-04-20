'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Bluebird = require('bluebird');

var _Bluebird2 = _interopRequireWildcard(_Bluebird);

var _globOriginal = require('glob');

var _globOriginal2 = _interopRequireWildcard(_globOriginal);

var _fsOriginal = require('fs');

var _fsOriginal2 = _interopRequireWildcard(_fsOriginal);

var _execOriginal = require('child_process');

'use strict';

var glob = _Bluebird2['default'].promisify(_globOriginal2['default']);
exports.glob = glob;
var fs = _Bluebird2['default'].promisifyAll(_fsOriginal2['default']);
exports.fs = fs;
var exec = _Bluebird2['default'].promisify(_execOriginal.exec);
exports.exec = exec;