import produce, { setAutoFreeze } from "immer"
import createDotPathMatcher from "dot-match"
import get from "lodash.get"
export const isFn = val => typeof val == "function"
export const isBool = val => typeof val == "boolean"
export const isArr = val => Array.isArray(val)
export const isStr = val => typeof val == "string"

setAutoFreeze(false)

class Controller {
    constructor({ path, options, actions, params }) {
        this.path = path
        this.options = options || {}
        this.actions = actions
        this.params = params || {}
        if (isStr(path)) this.matcher = createDotPathMatcher(path)
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

    produce(fn) {
        this.actions.push({
            matcher: createMatcher(this.path, this.options, this.matcher),
            handler: payload => {
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
            }
        })
        return this
    }

    rescue() {
        this.actions.push({
            matcher: createMatcher(this.path, this.options, this.matcher),
            rescue: payload => payload
        })
        return this
    }

    display(fn) {
        this.actions.push({
            matcher: createMatcher(this.path, this.options, this.matcher),
            handler: payload => {
                if (!payload) return payload
                if (isBool(fn)) {
                    if (fn) return payload
                    return false
                } else if (isFn(fn)) {
                    if (fn(payload)) return payload
                    return false
                }

                return payload
            }
        })
        return this
    }
}

const testOpts = (opts = {}, params, matcher) => {
    if (isFn(opts.include)) {
        return (
            opts.include(params) && testOpts({ exclude: opts.exclude }, params)
        )
    }

    if (isArr(opts.include)) {
        return (
            opts.include.some(path =>
                createDotPathMatcher(path)(params.path)
            ) && testOpts({ exclude: opts.exclude }, params, matcher)
        )
    }

    if (isFn(opts.exclude)) {
        return !opts.exclude(params)
    }

    if (isArr(opts.exclude)) {
        return !opts.exclude.some(path =>
            createDotPathMatcher(path)(params.path)
        )
    }

    return true
}

const transDotString = val => {
    if (!val) return ""
    if (isArr(val)) {
        return val.join(".")
    }
    return isStr(val) ? val : ""
}

const createMatcher = (path, options, matcher) => {
    return params => {
        const key = transDotString(
            params.key || params.name || params.index || params.path
        )
        if (isArr(path)) {
            return path.some(p =>
                createMatcher(p, options, createDotPathMatcher(p))(params)
            )
        } else if (path instanceof RegExp) {
            return path.test(key) && testOpts(options, params)
        } else if (isFn(path)) {
            return path(key, params) && testOpts(options, params)
        } else if (isStr(path)) {
            return matcher(params.path) && testOpts(options, params)
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

const createQuery = (actions, params) => {
    const query = (path, options) => {
        return new Controller({
            path,
            options,
            actions,
            params
        })
    }
    query.replace = replacePath
    query.path = () => params.path
    query.key = () =>
        transDotString(params.key || params.name || params.index || params.path)
    query.params = () => params
    query.payload = () => params.payload
    query.state = path => (path ? get(params.state, path) : params.state)
    return query
}

const createActions = (cmd, params) => {
    const actions = []
    cmd(createQuery(actions, params))
    return actions
}

const excute = (payload, actions, params) => {
    return actions.reduce((buf, action) => {
        if (action.handler) {
            return action.matcher(params) ? action.handler(buf) : buf
        } else if (action.rescue) {
            return action.matcher(params) ? payload : buf
        }
        return buf
    }, payload)
}

const extend = obj => {
    Object.assign(Controller.prototype, obj)
}

export { createActions, excute, extend }
