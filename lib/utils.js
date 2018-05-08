"use strict";

exports.__esModule = true;
exports.extend = exports.excute = exports.createActions = exports.isStr = exports.isArr = exports.isBool = exports.isFn = void 0;

var _immer = _interopRequireDefault(require("immer"));

var _dotMatch = _interopRequireDefault(require("dot-match"));

var _lodash = _interopRequireDefault(require("lodash.get"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isFn = function isFn(val) {
  return typeof val == "function";
};

exports.isFn = isFn;

var isBool = function isBool(val) {
  return typeof val == "boolean";
};

exports.isBool = isBool;

var isArr = function isArr(val) {
  return Array.isArray(val);
};

exports.isArr = isArr;

var isStr = function isStr(val) {
  return typeof val == "string";
};

exports.isStr = isStr;

var Controller =
/*#__PURE__*/
function () {
  function Controller(_ref) {
    var path = _ref.path,
        options = _ref.options,
        actions = _ref.actions,
        params = _ref.params;
    this.path = path;
    this.options = options || {};
    this.actions = actions;
    this.params = params || {};
    if (isStr(path)) this.matcher = (0, _dotMatch.default)(path);
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

  _proto.produce = function produce(fn) {
    this.actions.push({
      matcher: createMatcher(this.path, this.options, this.matcher),
      handler: function handler(payload) {
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
      }
    });
  };

  _proto.rescue = function rescue() {
    this.actions.push({
      matcher: createMatcher(this.path, this.options, this.matcher),
      rescue: function rescue(payload) {
        return payload;
      }
    });
  };

  _proto.display = function display(fn) {
    this.actions.push({
      matcher: createMatcher(this.path, this.options, this.matcher),
      handler: function handler(payload) {
        if (!payload) return payload;

        if (isBool(fn)) {
          if (fn) return payload;
          return false;
        } else if (isFn(fn)) {
          if (fn(payload)) return payload;
          return false;
        }

        return payload;
      }
    });
  };

  return Controller;
}();

var testOpts = function testOpts(opts, params) {
  if (opts === void 0) {
    opts = {};
  }

  if (isFn(opts.include)) {
    return opts.include(params) && testOpts({
      exclude: opts.exclude
    }, params);
  }

  if (isFn(opts.exclude)) {
    return !opts.exclude(params);
  }

  return true;
};

var transDotString = function transDotString(val) {
  if (!val) return "";

  if (isArr(val)) {
    return val.join(".");
  }

  return isStr(val) ? val : "";
};

var createMatcher = function createMatcher(path, options, matcher) {
  return function (params) {
    var key = transDotString(params.key || params.name || params.index || params.path);

    if (isArr(path)) {
      return path.some(function (p) {
        return createMatcher(p, options)(params);
      });
    } else if (path instanceof RegExp) {
      return path.test(key) && testOpts(options, params);
    } else if (isFn(path)) {
      return path(key, params) && testOpts(options, params);
    } else if (isStr(path)) {
      return matcher(params.path) && testOpts(options, params);
    }

    return false;
  };
};

var replacePath = function replacePath(path, replacer) {
  if (isArr(path)) {
    path = path.reduce(function (buf, item, index) {
      if (replacer && isFn(replacer["$" + index])) {
        buf[index] = replacer["$" + index](item);
      }

      return buf;
    }, []);
  } else {
    path = (path || "").trim().split(/\s*\.\s*/);
    path = path.reduce(function (buf, item, index) {
      if (replacer && isFn(replacer["$" + index])) {
        buf[index] = replacer["$" + index](item);
      } else {
        buf[index] = item;
      }

      return buf;
    }, []);
    return path.join(".");
  }
};

var createQuery = function createQuery(actions, params) {
  var query = function query(path, options) {
    return new Controller({
      path: path,
      options: options,
      actions: actions,
      params: params
    });
  };

  query.replace = replacePath;

  query.path = function () {
    return params.path;
  };

  query.key = function () {
    return transDotString(params.key || params.name || params.index || params.path);
  };

  query.params = function () {
    return params;
  };

  query.payload = function () {
    return params.payload;
  };

  query.state = function (path) {
    return (0, _lodash.default)(params.state, path);
  };

  return query;
};

var createActions = function createActions(cmd, params) {
  var actions = [];
  cmd(createQuery(actions, params));
  return actions;
};

exports.createActions = createActions;

var excute = function excute(payload, actions, params) {
  return actions.reduce(function (buf, action) {
    if (action.handler) {
      return action.matcher(params) ? action.handler(buf) : buf;
    } else if (action.rescue) {
      return action.matcher(params) ? payload : buf;
    }

    return buf;
  }, payload);
};

exports.excute = excute;

var extend = function extend(obj) {
  Object.assign(Controller.prototype, obj);
};

exports.extend = extend;