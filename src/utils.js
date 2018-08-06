import produce, { setAutoFreeze } from "immer"
import createDotPathMatcher from "dot-match"
import get from "lodash.get"
export const isFn = val => typeof val == "function"
export const isBool = val => typeof val == "boolean"
export const isObj = val => typeof val == "object"
export const isArr = val => Array.isArray(val)
export const isStr = val => typeof val == "string"

setAutoFreeze(false)

class Controller {
    constructor({ path, options, actions, params, cache }) {
        this.path = path
        this.options = options || {}
        this.actions = actions
        this.params = params || {}
        this.cache = cache
        if (isStr(path)) this.matcher = createDotPathMatcher(path, this.cache)
    }

    filter(fn) {
        this.options.include = fn
        return this
    }

    include(fn) {
        this.options.include = fn
        return this
    }

    exclude(fn) {
        this.options.exclude = fn
        return this
    }

    _createMatcher() {
        return createMatcher(this.path, this.options, this.matcher, this.cache)
    }

    createAction(handler, rescue) {
        this.actions.push({
            matcher: this._createMatcher(),
            handler,
            rescue
        })
    }

    call(fn) {
        this.createAction(payload => {
            if (isFn(fn)) produce(payload, fn)
            return payload
        })
        return this
    }

    produce(fn) {
        this.createAction(payload => {
            if (!payload) return payload
            let out
            let res = produce(payload, state => {
                if (isFn(fn)) {
                    out = fn(state)
                }
            })

            if (out === false) {
                return undefined
            } else {
                return res
            }
        })
        return this
    }

    pipe(...args) {
        return args.reduce((buf, fn) => {
            if (isFn(fn)) {
                return fn(buf)
            } else {
                return buf
            }
        }, this)
    }

    select(path, options) {
        return new Controller({
            path,
            options,
            actions: this.actions,
            params: this.params,
            cache: this.cache
        })
    }

    rescue() {
        this.actions.push({
            matcher: this._createMatcher(),
            rescue: payload => payload
        })
        return this
    }

    display(fn) {
        this.createAction(payload => {
            if (!payload) return payload
            if (isBool(fn)) {
                payload["data-propers-visible"] = fn
            } else if (isFn(fn)) {
                payload["data-propers-visible"] = !!fn(payload)
            }
            return payload
        })
        return this
    }
}

const toArr = val => {
    return isArr(val) ? val : val ? [val] : []
}

const isNotEmptyPath = path => {
    return toArr(path).length > 0
}

const testOpts = (opts = {}, params, cache) => {
    const _path = toArr(getParamsPath(params))

    if (isFn(opts.include)) {
        return (
            opts.include(params) && testOpts({ exclude: opts.exclude }, params)
        )
    }

    if (isArr(opts.include)) {
        return (
            opts.include.some(path =>
                createDotPathMatcher(path, cache)(_path)
            ) && testOpts({ exclude: opts.exclude }, params, cache)
        )
    }

    if (isFn(opts.exclude)) {
        return !opts.exclude(params)
    }

    if (isArr(opts.exclude)) {
        return !opts.exclude.some(path =>
            createDotPathMatcher(path, cache)(_path)
        )
    }

    return true
}

const parseString = str => {
    return String(str).split(".")
}

const transDotString = val => {
    if (!val) return ""
    if (isArr(val)) {
        return val.join(".")
    }
    return isStr(val) ? val : ""
}

const getParamsKey = params => {
    return transDotString(
        params.key || params.name || params.index || params.path
    )
}

const getParamsPath = params => {
    if (isArr(params.path)) return params.path
    if (isArr(params.key)) return params.key
    if (isStr(params.path)) return params.path.split(".")
    if (isStr(params.key)) return params.key.split(".")
}

const createMatcher = (path, options, matcher, cache) => {
    return (params = {}) => {
        const key = getParamsKey(params)
        if (isArr(path)) {
            return path.some(p =>
                createMatcher(
                    p,
                    options,
                    createDotPathMatcher(p, cache),
                    cache
                )(params)
            )
        } else if (path instanceof RegExp) {
            return path.test(key) && testOpts(options, params, cache)
        } else if (isFn(path)) {
            return path(key, params) && testOpts(options, params, cache)
        } else if (isStr(path)) {
            return (
                matcher(getParamsPath(params)) &&
                testOpts(options, params, cache)
            )
        }

        return false
    }
}

const replacePath = (path, replacer) => {
    if (isArr(path)) {
        return path.reduce((buf, item, index) => {
            const name = "$" + index
            if (replacer) {
                if (isFn(replacer[name])) {
                    buf[index] = replacer[name](item)
                } else if (isStr(replacer[name])) {
                    buf[index] = replacer[name]
                } else {
                    buf[index] = item
                }
            } else {
                buf[index] = item
            }
            return buf
        }, [])
    } else {
        path = (path || "").trim().split(/\s*\.\s*/)
        path = path.reduce((buf, item, index) => {
            const name = "$" + index
            if (replacer) {
                if (isFn(replacer[name])) {
                    buf[index] = replacer[name](item)
                } else if (isStr(replacer[name])) {
                    buf[index] = replacer[name]
                } else {
                    buf[index] = item
                }
            } else {
                buf[index] = item
            }
            return buf
        }, [])
        return path.join(".")
    }
}

const createQuery = (actions, params, cache) => {
    const query = (path, options) => {
        return new Controller({
            path,
            options,
            actions,
            params,
            cache
        })
    }
    query.replace = replacePath
    query.path = () => getParamsPath(params)
    query.key = () => getParamsKey(params)
    query.params = () => params
    query.payload = () => params.payload
    query.state = path => (path ? get(params.state, path) : params.state)
    return query
}

const createActions = (cmd, params, cache) => {
    const actions = []
    cmd(createQuery(actions, params, cache))
    return actions
}

const excute = (payload, actions, params) => {
    return actions.reduce((buf, action) => {
        if (action.handler) {
            return action.matcher(params) &&
                isNotEmptyPath(getParamsPath(params))
                ? action.handler(buf)
                : buf
        } else if (action.rescue) {
            return action.matcher(params) &&
                isNotEmptyPath(getParamsPath(params))
                ? payload
                : buf
        }
        return buf
    }, payload)
}

const extend = obj => {
    Object.assign(Controller.prototype, obj)
}

export { createActions, excute, extend }
