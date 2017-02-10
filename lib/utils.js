
const Promise = require('bluebird')
const co = Promise.coroutine

module.exports = {
  Promise,
  co,
  getPathForTag,
  toCamelCaseStyles,
  toAngryStyles,
}

function getPathForTag (prefix, tag) {
  return `${prefix}.${tag}`
}

function toCamelCaseStyles (styles) {
  const camel = {}
  Object.keys(styles).forEach(prop => {
    // BOO_HOO => booHoo
    const camelName = joinCamelCase(prop.toLowerCase().split('_'))
    camel[camelName] = styles[prop]
  })

  return camel
}

function toAngryStyles (styles) {
  const angry = {}
  Object.keys(styles).forEach(prop => {
    // booHoo => BOO_HOO
    const angryName = splitCamelCase(prop)
    angry[angryName] = styles[prop]
  })

  return angry
}

function joinCamelCase (arr) {
  const humps = arr.slice(1).map(capFirst)
  return arr[0] + humps.join('')
}

function splitCamelCase (str) {
  return str.split(/(?=[A-Z])/g)
}

function capFirst (str) {
  return str[0].toUpperCase() + str.slice(1)
}
