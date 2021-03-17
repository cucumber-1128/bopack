const path = require('path')

const log = console.log.bind(console)

const gidGenerator = (() => {
    let id = 0
    let f = () => {
        id++
        return id
    }
    return f
})()

const resolvePath = (base, relativePath) => {
    let absolute = path.resolve(base, relativePath)
    let p = require.resolve(absolute)
    return p
}

module.exports = {
    log,
    resolvePath: resolvePath,
    gidGenerator: gidGenerator,
}