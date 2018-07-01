"use strict";

exports.__esModule = true;
var _exportNames = {
  qverse: true,
  extend: true
};
exports.default = exports.qverse = void 0;

var _utils = require("./utils");

exports.extend = _utils.extend;

var _operators = require("./operators");

Object.keys(_operators).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _operators[key];
});

var qverse = function qverse($path, $params, cmd) {
  var higher = false;

  if ((0, _utils.isFn)($path)) {
    cmd = $path;
    higher = true;
  }

  if ((0, _utils.isFn)($params)) {
    cmd = $params;
    $params = undefined;
  }

  if ((0, _utils.isObj)($params)) {
    if ((0, _utils.isStr)($path) || (0, _utils.isArr)($path)) {
      $params.path = $path;
      $params.payload = $params.payload || {};
      higher = false;
    } else {
      higher = true;
    }
  } else {
    if ((0, _utils.isStr)($path) || (0, _utils.isArr)($path)) {
      $params = {
        path: $path,
        payload: {}
      };
      higher = false;
    } else {
      higher = true;
    }
  }

  if (!(0, _utils.isFn)(cmd)) throw new Error("[Qverse Error] Controller must be a function.");

  if (!higher) {
    return (0, _utils.excute)($params.payload, (0, _utils.createActions)(cmd, $params), $params);
  }

  var cache = new Map();
  return function (payload, params) {
    return (0, _utils.excute)(payload, (0, _utils.createActions)(cmd, params, cache), params);
  };
};

exports.qverse = qverse;
var _default = qverse;
exports.default = _default;