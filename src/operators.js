export const filter = fn => ctrl => {
    ctrl.filter(fn)
    return ctrl
}

export const include = fn => ctrl => {
    ctrl.include(fn)
    return ctrl
}

export const exclude = fn => ctrl => {
    ctrl.exclude(fn)
    return ctrl
}

export const call = fn => ctrl => {
    ctrl.call(fn)
    return ctrl
}

export const produce = fn => ctrl => {
    ctrl.produce(fn)
    return ctrl
}

export const select = fn => ctrl => {
    ctrl.select(fn)
    return ctrl
}

export const rescue = fn => ctrl => {
    ctrl.rescue(fn)
    return ctrl
}

export const display = fn => ctrl => {
    ctrl.display(fn)
    return ctrl
}
