const {
  getPathForTag,
  shallowClone
} = require('./utils')
const stylesPackFormRequest = require('./form-request-model')
const STRINGS = require('./strings')
const TYPE = '_t'
const PATRONIZE = 'Awww, sweetie! You don\'t need help! But anyway, here are the commands I understand:'

module.exports = function createCommands ({ bot, style }) {
  const send = (user, object) => bot.send({ userId: user.id, object })
  const commands = [
    {
      name: 'help',
      description: 'if you want to read this again',
      regex: /^help$/i,
      action: help
    },
    {
      name: 'view',
      description: 'show the current style values',
      regex: /^view$/i,
      action: view
    },
    {
      name: 'list',
      description: 'list style properties',
      regex: /^list$/i,
      action: list
    },
    {
      name: 'edit',
      description: 'edit the styles en masse',
      regex: /^edit$/i,
      action: edit
    },
    {
      name: 'set',
      description: 'edit the styles en masse',
      regex: /^set\s+([a-zA-Z]+)\s+([#a-zA-Z]+)$/i,
      action: set
    },
    {
      name: 'reset',
      description: 'reset the style to factory settings',
      regex: /^reset$/i,
      action: reset
    }
  ]

  const descriptions = commands
    .map(command => {
      const { name, description } = command
      return `${name.toUpperCase()}  ${description}`
    })
    .join('\n\n')

  const HELP_TEXT = `${PATRONIZE}\n\n${descriptions}`

  // commands.forEach(command => {
  //   commands[command.name] = command
  // })

  function interpretMessage (message) {
    const command = commands.find(command => command.regex.test(message))
    if (!command) return

    const args = message
      .split(' ')
      // filter out empty
      .filter(str => str)

    // remove command name itself
    args.shift()
    return shallowClone(command, {
      action: command.action.bind({ args })
    })
  }

  // COMMANDS
  function help ({ user }) {
    return send(user, HELP_TEXT)
  }

  function reset ({ user, baseStyles }) {
    style.set({ user, style: baseStyles })
    return send(user, STRINGS.SAVED)
  }

  function list ({ user, baseStyles }) {
    return send(user, Object.keys(baseStyles).join('\n'))
  }

  function view ({ user, baseStyles }) {
    const current = style.get({ user })
    const text = Object.keys(stylesPackFormRequest.properties)
      .map(prop => {
        const value = typeof current[prop] === 'undefined'
          ? baseStyles[prop]
          : current[prop]

        return `${prop}\n${JSON.stringify(value, null, 2)}`
      })
      .join('\n\n')

    return send(user, text)
  }

  function set ({ user, baseStyles }) {
    /* eslint no-invalid-this: "off" */
    const current = style.get({ user })
    current[this.args[0]] = this.args[1]
    const saved = style.set({ user, style: current })
    const msg = saved ? STRINGS.SAVED : STRINGS.TRY_AGAIN
    return send(user, msg)
  }

  function edit ({ user, baseStyles }) {
    const { properties, id } = stylesPackFormRequest
    const formRequest = {
      [TYPE]: 'tradle.FormError',
      form: id,
      message: 'Edit your styles',
      errors: [],
      prefill: {
        [TYPE]: STRINGS.STYLES_PACK
      }
    }

    const current = style.get({ user })
    for (let prop in properties) {
      if (current[prop]) {
        formRequest.prefill[prop] = current[prop]
      }
    }

    return send(user, formRequest)
  }

  return {
    interpret: interpretMessage
  }
}
