"use strict";

exports.__esModule = true;
exports.default = exports.qverse = void 0;

var _utils = require("./utils");

exports.extend = _utils.extend;

var qverse = function qverse(cmd) {
  return function (payload, params) {
    if (!(0, _utils.isFn)(cmd)) return payload;
    return (0, _utils.excute)(payload, (0, _utils.createActions)(cmd, params), params);
  };
};

exports.qverse = qverse;
var _default = qverse;
exports.default = _default;