import log from './helper/log'
import e from './helper/e'

const bindEventLogin = () => {
    let button = e('#id-button-login')
    let box = e('.div-box')

    button.addEventListener('click', (event) => {
        box.classList.add('pink')
        log('click')
    })
}

const bindEvents = () => {
    bindEventLogin()
}

const __main = () => {
    bindEvents()
}

__main()