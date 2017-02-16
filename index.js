
const fetch = require('node-fetch')
const debug = require('debug')('tradle:bot:style-me')
const requireModels = require('@tradle/bot-require-models')
const {
  Promise,
  co,
  isPromise,
  getPathForTag,
  toCamelCaseStyles,
  shallowClone
} = require('./lib/utils')

const STRINGS = require('./lib/strings')
const TYPE = '_t'
const BASE_STYLE_URL = 'https://raw.githubusercontent.com/pgmemk/TiM/master/styles/bankStyle.json'
const STORAGE_KEY = require('./package.json').name
const stylesPackFormRequest = require('./lib/form-request-model')
const MODELS = [stylesPackFormRequest]
const createCommands = require('./lib/commands')
const manageStyle = require('./lib/style')

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

    if (type === STRINGS.STYLES_PACK) {
      style.set({ user, style: object })
      bot.users.save(user)
      send(user, STRINGS.WHOA_GENIUS)
      return sendStylePack(user)
    }

    if (type !== 'tradle.SimpleMessage') return

    const { message } = object
    const command = commands.interpret(message)
    if (!command) {
      if (message.length < 10) {
        return send(user, `"${message}"?? Don't talk to me about "${message}". Don't EVER talk to me about "${message}"!`)
      }

      return send(user, STRINGS.NO_COMPRENDO)
    }

    const { name, action } = command
    if (name !== 'help') yield initPromise

    const maybePromise = action({ bot, user, baseStyles })
    if (isPromise(maybePromise)) yield maybePromise

    if (name === 'set' || name === 'reset') {
      sendStylePack(user)
    }
  })

  function sendStylePack (user, tag) {
    const custom = style.get({ user, tag })
    const stylePack = shallowClone(baseStyles, custom)
    stylePack[TYPE] = STRINGS.STYLES_PACK
    return send(user, stylePack)
  }

  function sendIntroduction (user) {
    send(user, STRINGS.INTRODUCTION)
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
