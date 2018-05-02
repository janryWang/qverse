import produce from "immer"
import createDotPathMatcher from "dot-match"
import get from "lodash.get"
export const isFn = val => typeof val == "function"
export const isBool = val => typeof val == "boolean"
export const isArr = val => Array.isArray(val)
export const isStr = val => typeof val == "string"

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

    state(path) {
        return get(this.params.state, path)
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
    }

    rescue() {
        this.actions.push({
            matcher: createMatcher(this.path, this.options, this.matcher),
            rescue: payload => payload
        })
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
    }
}

const testOpts = (opts = {}, params) => {
    if (isFn(opts.include)) {
        return (
            opts.include(params) && testOpts({ exclude: opts.exclude }, params)
        )
    }

    if (isFn(opts.exclude)) {
        return !opts.exclude(params)
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
            return path.some(p => createMatcher(p, options)(params))
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
        path = path.reduce((buf, item, index) => {
            if (replacer && isFn(replacer["$" + index])) {
                buf[index] = replacer["$" + index](item)
            }
            return buf
        }, [])
    } else {
        path = (path || "").trim().split(/\s*\.\s*/)
        path = path.reduce((buf, item, index) => {
            if (replacer && isFn(replacer["$" + index])) {
                buf[index] = replacer["$" + index](item)
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
