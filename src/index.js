import {
    excute,
    createActions,
    extend,
    isFn,
    isObj,
    isStr,
    isArr
} from "./utils"

export const qverse = ($path, $params, cmd) => {
    let higher = false
    if (isFn($path)) {
        cmd = $path
        higher = true
    }
    if (isFn($params)) {
        cmd = $params
        $params = undefined
    }

    if (isObj($params)) {
        if (isStr($path) || isArr($path)) {
            $params.path = $path
            $params.payload = $params.payload || {}
            higher = false
        } else {
            higher = true
        }
    } else {
        if (isStr($path) || isArr($path)) {
            $params = {
                path: $path,
                payload: {}
            }
            higher = false
        } else {
            higher = true
        }
    }

    if (!isFn(cmd))
        throw new Error("[Qverse Error] Controller must be a function.")

    if (!higher) {
        return excute($params.payload, createActions(cmd, $params), $params)
    }

    const cache = new Map()

    return (payload, params) => {
        return excute(payload, createActions(cmd, params, cache), params)
    }
}

export { extend }

export default qverse
