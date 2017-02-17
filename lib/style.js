
const {
  getPathForTag,
  shallowClone
} = require('./utils')

const STYLE_PACK_PROPS = require('./tradle.StylesPack').properties

module.exports = function ({ bot, prefix }) {
  const myPathForTag = getPathForTag.bind(null, prefix)

  function get ({ user, tag='current' }) {
    const style = user[myPathForTag(tag)] || {}
    return shallowClone(style)
  }

  function set ({ user, tag='current', style }) {
    const current = get({ user, tag }) || {}
    let saved
    for (let p in STYLE_PACK_PROPS) {
      if (p in style) {
        saved = true
        let val = style[p]
        if (typeof val === 'string') {
          val = val.toLowerCase()
        }

        current[p] = val
      }
    }

    if (saved) {
      user[myPathForTag(tag)] = current
      bot.users.save(user)
      return true
    }
  }

  return { get, set }
}
