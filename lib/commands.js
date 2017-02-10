const { getPathForTag } = require('./utils')
const stylesPackFormRequest = require('./form-request-model')
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
    for (let command of commands) {
      if (command.regex.test(message)) {
        return command
      }
    }
  }

  // COMMANDS
  function help ({ user }) {
    return send(user, HELP_TEXT)
  }

  function reset ({ user, baseStyles }) {
    style.set({ user, style: baseStyles })
  }

  function list ({ user, baseStyles }) {
    return send(user, Object.keys(baseStyles).join('\n'))
  }

  function view ({ user, baseStyles }) {
    const current = style.get({ user }) || baseStyles
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


  function edit ({ user, baseStyles }) {
    const { properties, id } = stylesPackFormRequest
    const formRequest = {
      [TYPE]: 'tradle.FormError',
      form: id,
      message: 'Edit your styles',
      prefill: {
        [TYPE]: 'tradle.StylesPack'
      }
    }

    const current = style.get({ user }) || baseStyles
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
