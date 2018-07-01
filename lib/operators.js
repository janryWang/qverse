"use strict";

exports.__esModule = true;
exports.display = exports.rescue = exports.select = exports.produce = exports.call = exports.exclude = exports.include = exports.filter = void 0;

var filter = function filter(fn) {
  return function (ctrl) {
    ctrl.filter(fn);
    return ctrl;
  };
};

exports.filter = filter;

var include = function include(fn) {
  return function (ctrl) {
    ctrl.include(fn);
    return ctrl;
  };
};

exports.include = include;

var exclude = function exclude(fn) {
  return function (ctrl) {
    ctrl.exclude(fn);
    return ctrl;
  };
};

exports.exclude = exclude;

var call = function call(fn) {
  return function (ctrl) {
    ctrl.call(fn);
    return ctrl;
  };
};

exports.call = call;

var produce = function produce(fn) {
  return function (ctrl) {
    ctrl.produce(fn);
    return ctrl;
  };
};

exports.produce = produce;

var select = function select(fn) {
  return function (ctrl) {
    ctrl.select(fn);
    return ctrl;
  };
};

exports.select = select;

var rescue = function rescue(fn) {
  return function (ctrl) {
    ctrl.rescue(fn);
    return ctrl;
  };
};

exports.rescue = rescue;

var display = function display(fn) {
  return function (ctrl) {
    ctrl.display(fn);
    return ctrl;
  };
};

exports.display = display;