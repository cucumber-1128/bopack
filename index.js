const pack = require('./static/js/lib/bopack')
const config = require('./bopack.config')
console.log('config', config)

const __main = () => {
    let entry = require.resolve(config.entry)
    pack(entry, config)
}

if (require.main === module) {
    __main()
}