"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WatchMap = (function () {
  function WatchMap() {
    _classCallCheck(this, WatchMap);

    this.map = new Map();
  }

  _createClass(WatchMap, [{
    key: "put",
    value: function put(task, srcFile, detail) {
      if (!this.map.has(task)) {
        this.map.set(task, new Map());
      }

      this.map.get(task).set(srcFile, detail);
    }
  }, {
    key: "has",
    value: function has(task, srcFile) {
      if (!this.map.has(task)) return false;
      if (!this.map.get(task).has(srcFile)) return false;
      return true;
    }
  }, {
    key: "get",
    value: function get(task, srcFile) {
      return this.map.get(task).get(srcFile);
    }
  }, {
    key: Symbol.iterator,
    value: regeneratorRuntime.mark(function value() {
      var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step$value, task, fileMap, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _step2$value, srcFile, detail;

      return regeneratorRuntime.wrap(function value$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            context$2$0.prev = 3;
            _iterator = this.map[Symbol.iterator]();

          case 5:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              context$2$0.next = 40;
              break;
            }

            _step$value = _slicedToArray(_step.value, 2);
            task = _step$value[0];
            fileMap = _step$value[1];
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            context$2$0.prev = 12;
            _iterator2 = fileMap[Symbol.iterator]();

          case 14:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              context$2$0.next = 23;
              break;
            }

            _step2$value = _slicedToArray(_step2.value, 2);
            srcFile = _step2$value[0];
            detail = _step2$value[1];
            context$2$0.next = 20;
            return [task, srcFile, detail];

          case 20:
            _iteratorNormalCompletion2 = true;
            context$2$0.next = 14;
            break;

          case 23:
            context$2$0.next = 29;
            break;

          case 25:
            context$2$0.prev = 25;
            context$2$0.t0 = context$2$0["catch"](12);
            _didIteratorError2 = true;
            _iteratorError2 = context$2$0.t0;

          case 29:
            context$2$0.prev = 29;
            context$2$0.prev = 30;

            if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
              _iterator2["return"]();
            }

          case 32:
            context$2$0.prev = 32;

            if (!_didIteratorError2) {
              context$2$0.next = 35;
              break;
            }

            throw _iteratorError2;

          case 35:
            return context$2$0.finish(32);

          case 36:
            return context$2$0.finish(29);

          case 37:
            _iteratorNormalCompletion = true;
            context$2$0.next = 5;
            break;

          case 40:
            context$2$0.next = 46;
            break;

          case 42:
            context$2$0.prev = 42;
            context$2$0.t1 = context$2$0["catch"](3);
            _didIteratorError = true;
            _iteratorError = context$2$0.t1;

          case 46:
            context$2$0.prev = 46;
            context$2$0.prev = 47;

            if (!_iteratorNormalCompletion && _iterator["return"]) {
              _iterator["return"]();
            }

          case 49:
            context$2$0.prev = 49;

            if (!_didIteratorError) {
              context$2$0.next = 52;
              break;
            }

            throw _iteratorError;

          case 52:
            return context$2$0.finish(49);

          case 53:
            return context$2$0.finish(46);

          case 54:
          case "end":
            return context$2$0.stop();
        }
      }, value, this, [[3, 42, 46, 54], [12, 25, 29, 37], [30,, 32, 36], [47,, 49, 53]]);
    })
  }]);

  return WatchMap;
})();

exports["default"] = WatchMap;
module.exports = exports["default"];