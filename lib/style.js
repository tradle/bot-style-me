
const { getPathForTag } = require('./utils')
const STYLE_PACK_PROPS = require('./tradle.StylesPack').properties

module.exports = function ({ bot, prefix }) {
  const myPathForTag = getPathForTag.bind(null, prefix)

  function get ({ user, tag='current' }) {
    return user[myPathForTag(tag)]
  }

  function set ({ user, tag='current', style }) {
    const current = get({ user, tag })
    for (let p in STYLE_PACK_PROPS) {
      if (p in style) {
        current[style] = style[p]
      }
    }

    user[myPathForTag(tag)] = current
    bot.users.save(user)
  }

  return { get, set }
}
