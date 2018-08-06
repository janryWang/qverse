"use strict";

exports.__esModule = true;
exports.extend = exports.excute = exports.createActions = exports.isStr = exports.isArr = exports.isObj = exports.isBool = exports.isFn = void 0;

var _immer = _interopRequireWildcard(require("immer"));

var _dotMatch = _interopRequireDefault(require("dot-match"));

var _lodash = _interopRequireDefault(require("lodash.get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var isFn = function isFn(val) {
  return typeof val == "function";
};

exports.isFn = isFn;

var isBool = function isBool(val) {
  return typeof val == "boolean";
};

exports.isBool = isBool;

var isObj = function isObj(val) {
  return typeof val == "object";
};

exports.isObj = isObj;

var isArr = function isArr(val) {
  return Array.isArray(val);
};

exports.isArr = isArr;

var isStr = function isStr(val) {
  return typeof val == "string";
};

exports.isStr = isStr;
(0, _immer.setAutoFreeze)(false);

var Controller =
/*#__PURE__*/
function () {
  function Controller(_ref) {
    var path = _ref.path,
        options = _ref.options,
        actions = _ref.actions,
        params = _ref.params,
        cache = _ref.cache;
    this.path = path;
    this.options = options || {};
    this.actions = actions;
    this.params = params || {};
    this.cache = cache;
    if (isStr(path)) this.matcher = (0, _dotMatch.default)(path, this.cache);
  }

  var _proto = Controller.prototype;

  _proto.filter = function filter(fn) {
    this.options.include = fn;
    return this;
  };

  _proto.include = function include(fn) {
    this.options.include = fn;
    return this;
  };

  _proto.exclude = function exclude(fn) {
    this.options.exclude = fn;
    return this;
  };

  _proto._createMatcher = function _createMatcher() {
    return createMatcher(this.path, this.options, this.matcher, this.cache);
  };

  _proto.createAction = function createAction(handler, rescue) {
    this.actions.push({
      matcher: this._createMatcher(),
      handler: handler,
      rescue: rescue
    });
  };

  _proto.call = function call(fn) {
    this.createAction(function (payload) {
      if (isFn(fn)) (0, _immer.default)(payload, fn);
      return payload;
    });
    return this;
  };

  _proto.produce = function produce(fn) {
    this.createAction(function (payload) {
      if (!payload) return payload;
      var out;
      var res = (0, _immer.default)(payload, function (state) {
        if (isFn(fn)) {
          out = fn(state);
        }
      });

      if (out === false) {
        return undefined;
      } else {
        return res;
      }
    });
    return this;
  };

  _proto.pipe = function pipe() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return args.reduce(function (buf, fn) {
      if (isFn(fn)) {
        return fn(buf);
      } else {
        return buf;
      }
    }, this);
  };

  _proto.select = function select(path, options) {
    return new Controller({
      path: path,
      options: options,
      actions: this.actions,
      params: this.params,
      cache: this.cache
    });
  };

  _proto.rescue = function rescue() {
    this.actions.push({
      matcher: this._createMatcher(),
      rescue: function rescue(payload) {
        return payload;
      }
    });
    return this;
  };

  _proto.display = function display(fn) {
    this.createAction(function (payload) {
      if (!payload) return payload;

      if (isBool(fn)) {
        payload["data-propers-hidden"] = !fn;
      } else if (isFn(fn)) {
        payload["data-propers-hidden"] = !fn(payload);
      }

      return payload;
    });
    return this;
  };

  return Controller;
}();

var toArr = function toArr(val) {
  return isArr(val) ? val : val ? [val] : [];
};

var isNotEmptyPath = function isNotEmptyPath(path) {
  return toArr(path).length > 0;
};

var testOpts = function testOpts(opts, params, cache) {
  if (opts === void 0) {
    opts = {};
  }

  var _path = toArr(getParamsPath(params));

  if (isFn(opts.include)) {
    return opts.include(params) && testOpts({
      exclude: opts.exclude
    }, params);
  }

  if (isArr(opts.include)) {
    return opts.include.some(function (path) {
      return (0, _dotMatch.default)(path, cache)(_path);
    }) && testOpts({
      exclude: opts.exclude
    }, params, cache);
  }

  if (isFn(opts.exclude)) {
    return !opts.exclude(params);
  }

  if (isArr(opts.exclude)) {
    return !opts.exclude.some(function (path) {
      return (0, _dotMatch.default)(path, cache)(_path);
    });
  }

  return true;
};

var parseString = function parseString(str) {
  return String(str).split(".");
};

var transDotString = function transDotString(val) {
  if (!val) return "";

  if (isArr(val)) {
    return val.join(".");
  }

  return isStr(val) ? val : "";
};

var getParamsKey = function getParamsKey(params) {
  return transDotString(params.key || params.name || params.index || params.path);
};

var getParamsPath = function getParamsPath(params) {
  if (isArr(params.path)) return params.path;
  if (isArr(params.key)) return params.key;
  if (isStr(params.path)) return params.path.split(".");
  if (isStr(params.key)) return params.key.split(".");
};

var createMatcher = function createMatcher(path, options, matcher, cache) {
  return function (params) {
    if (params === void 0) {
      params = {};
    }

    var key = getParamsKey(params);

    if (isArr(path)) {
      return path.some(function (p) {
        return createMatcher(p, options, (0, _dotMatch.default)(p, cache), cache)(params);
      });
    } else if (path instanceof RegExp) {
      return path.test(key) && testOpts(options, params, cache);
    } else if (isFn(path)) {
      return path(key, params) && testOpts(options, params, cache);
    } else if (isStr(path)) {
      return matcher(getParamsPath(params)) && testOpts(options, params, cache);
    }

    return false;
  };
};

var replacePath = function replacePath(path, replacer) {
  if (isArr(path)) {
    return path.reduce(function (buf, item, index) {
      var name = "$" + index;

      if (replacer) {
        if (isFn(replacer[name])) {
          buf[index] = replacer[name](item);
        } else if (isStr(replacer[name])) {
          buf[index] = replacer[name];
        } else {
          buf[index] = item;
        }
      } else {
        buf[index] = item;
      }

      return buf;
    }, []);
  } else {
    path = (path || "").trim().split(/\s*\.\s*/);
    path = path.reduce(function (buf, item, index) {
      var name = "$" + index;

      if (replacer) {
        if (isFn(replacer[name])) {
          buf[index] = replacer[name](item);
        } else if (isStr(replacer[name])) {
          buf[index] = replacer[name];
        } else {
          buf[index] = item;
        }
      } else {
        buf[index] = item;
      }

      return buf;
    }, []);
    return path.join(".");
  }
};

var createQuery = function createQuery(actions, params, cache) {
  var query = function query(path, options) {
    return new Controller({
      path: path,
      options: options,
      actions: actions,
      params: params,
      cache: cache
    });
  };

  query.replace = replacePath;

  query.path = function () {
    return getParamsPath(params);
  };

  query.key = function () {
    return getParamsKey(params);
  };

  query.params = function () {
    return params;
  };

  query.payload = function () {
    return params.payload;
  };

  query.state = function (path) {
    return path ? (0, _lodash.default)(params.state, path) : params.state;
  };

  return query;
};

var createActions = function createActions(cmd, params, cache) {
  var actions = [];
  cmd(createQuery(actions, params, cache));
  return actions;
};

exports.createActions = createActions;

var excute = function excute(payload, actions, params) {
  return actions.reduce(function (buf, action) {
    if (action.handler) {
      return action.matcher(params) && isNotEmptyPath(getParamsPath(params)) ? action.handler(buf) : buf;
    } else if (action.rescue) {
      return action.matcher(params) && isNotEmptyPath(getParamsPath(params)) ? payload : buf;
    }

    return buf;
  }, payload);
};

exports.excute = excute;

var extend = function extend(obj) {
  Object.assign(Controller.prototype, obj);
};

exports.extend = extend;