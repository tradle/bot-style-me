
const fetch = require('node-fetch')
const debug = require('debug')('tradle:bot:style-me')
const requireModels = require('@tradle/bot-require-models')
const {
  Promise,
  co,
  getPathForTag,
  toCamelCaseStyles
} = require('./lib/utils')

const TYPE = '_t'
const BASE_STYLE_URL = 'https://raw.githubusercontent.com/pgmemk/TiM/master/styles/bankStyle.json'
const STORAGE_KEY = require('./package.json').name
const stylesPackFormRequest = require('./lib/form-request-model')
const MODELS = [stylesPackFormRequest]
const createCommands = require('./lib/commands')
const manageStyle = require('./lib/style')

const INTRODUCTION = 'Ahh, finally, someone fashion conscious! Type "help" to see what I can do'
const NO_COMPRENDO = 'I don\'t understand. If you\'re lost or a total noob, type "help"'

module.exports = function styleMe (bot) {
  bot.use(requireModels(MODELS))

  const prefix = STORAGE_KEY
  const style = manageStyle({ bot, prefix })
  const commands = createCommands({ bot, style })
  const send = (user, object) => bot.send({ userId: user.id, object })

  const loadStylesFromGithub = co(function* () {
    const resp = yield fetch(BASE_STYLE_URL)
    const styles = yield resp.json()
    return toCamelCaseStyles(styles)
  })

  let baseStyles
  const getBaseStyles = co(function* () {
    let styles
    try {
      styles = yield Promise.race([
        timeoutAfter(10000),
        loadStylesFromGithub()
      ])

      bot.shared.set(getPathForTag('base'), styles)
    } catch (err) {
      debug('failed to get base styles', err)
      styles = bot.shared.get(STORAGE_KEY)
      if (!styles) {
        throw new Error('failed to get base styles')
      }
    }

    return styles
  })

  const initPromise = co(function* init () {
    baseStyles = yield getBaseStyles()
  })()

  const onmessage = co(function* onmessage ({ user, object }) {
    const type = object[TYPE]
    if (isGreeting(type)) return sendIntroduction(user)

    if (type === stylesPackFormRequest.id) {
      style.set({ user, style: object })
      bot.users.save(user)
      return
    }

    if (type !== 'tradle.SimpleMessage') return

    const { message } = object
    const command = commands.interpret(message)
    if (!command) {
      if (message.length < 10) {
        return send(user, `"${message}"?? Don't talk to me about "${message}". Don't EVER talk to me about "${message}"!`)
      }

      return send(user, NO_COMPRENDO)
    }

    const { name, action } = command
    if (name !== 'help') yield initPromise

    return action({ bot, user, baseStyles })
  })

  function sendIntroduction (user) {
    send(user, INTRODUCTION)
  }

  bot.users.on('create', sendIntroduction)
  const removeHandler = bot.addReceiveHandler(onmessage)

  return function disable () {
    bot.users.removeListener('create', sendIntroduction)
    removeHandler()
  }
}

function timeoutAfter (millis) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('timed out'))
    }, millis)
  })
}

function isGreeting (type) {
  return type === 'tradle.CustomerWaiting' ||
    type === 'tradle.IdentityPublishRequest' ||
    type === 'tradle.SelfIntroduction'
}
