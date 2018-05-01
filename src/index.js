import { excute, createActions, extend, isFn } from "./utils"

export const qverse = cmd => {
    return (payload, params) => {
        if (!isFn(cmd)) return payload
        return excute(payload, createActions(cmd, params), params)
    }
}

export { extend }

export default qverse
