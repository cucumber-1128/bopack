const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const { transformFromAstSync } = require('@babel/core')

const { log, gidGenerator, resolvePath } = require('./utils')


const astForCode = (code) => {
    let ast = parser.parse(code, {
        sourceType: 'module',
    })
    return ast
}

const codeForAst = (ast, sourceCode) => {
    let r = transformFromAstSync(ast, sourceCode, {
        presets: ['@babel/preset-env'],
    })
    return r.code
}

const moduleTemplate = (graph, mapping) => {
    // {
    //     id: 3,
    //         dependencies: {},
    //     code: '"use strict";\n' +
    //     '\n' +
    //     'var e = function e(selector) {\n' +
    //     '  return document.querySelector(selector);\n' +
    //     '};\n' +
    //     '\n' +
    //     'module.exports = e;',
    //         content: 'const e = selector => document.querySelector(selector)\n' +
    // '\n' +
    // 'module.exports = e'
    // }
    let g = graph
    let m = JSON.stringify(mapping)
    let s = `
        ${g.id}: [
            function(require, module, exports) {
                ${g.code}
            },
            ${m}
        ],
    `
    return s
}

const moduleFromGraph = (graph) => {
    let modules = ''
    Object.values(graph).forEach(g => {
        // {
        //     id: id,
        //     dependencies: ds,
        //     code: es5Code,
        //     content: s,
        // }

        let ds = g.dependencies

        let o = {}
        Object.entries(ds).forEach(([k, v]) => {
            o[k] = graph[v].id
        })

        log('graph o is', g)

        modules += moduleTemplate(g, o)
    })
    return modules
}

const bundleTemplate = (module) => {
    let s = `
        (function(modules) {
            const require = (id) => {
                let [fn, mapping] = modules[id]

                const localRequire = (name) => {
                    return require(mapping[name])
                }

                const localModule = {
                    exports: {

                    }
                }

                fn(localRequire, localModule, localModule.exports)

                return localModule.exports
            }

            require(1)
        })({${module}})
    `
    return s
}

const saveBundle = (bundle, file) => {
    fs.writeFileSync(file, bundle)
}

const collectedDeps = (entry) => {
    let s = fs.readFileSync(entry, 'utf8')
    let ast = astForCode(s)

    let l = []
    traverse(ast, {
        ImportDeclaration(path) {
            let module = path.node.source.value
            l.push(module)
        }
    })
    let o = {}
    l.forEach(e => {
        let directory = path.dirname(entry)
        let p = resolvePath(directory, e)

        o[e] = p
    })
    return o
}

const parsedEntry = (entry) => {
    let o = {}
    let id = gidGenerator()
    let ds = collectedDeps(entry)
    let s = fs.readFileSync(entry, 'utf8')
    let ast = astForCode(s)

    let es5Code = codeForAst(ast, s)


    o[entry] = {
        id: id,
        dependencies: ds,
        code: es5Code,
        content: s,
    }

    Object.values(ds).forEach(d => {
        let r = parsedEntry(d)
        Object.assign(o, r)
    })

    return o
}

const bundle = (entry, config) => {
    let graph = parsedEntry(entry)
    let module = moduleFromGraph(graph)
    let bundle = bundleTemplate(module)
    let file = path.join(config.output.directory, config.output.filename)
    log('file', file)
    saveBundle(bundle, file)
}

module.exports = bundle
