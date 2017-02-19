const validate = require('@tradle/validate-model')
const stylesPackModel = require('./tradle.StylesPack')
module.exports = createStylesPackForm()

function createStylesPackForm () {
  const model = {
    type: 'tradle.Model',
    title: 'Custom Styles',
    id: 'me.style.bot.StylesPackForm',
    subClassOf: 'tradle.Form',
    interfaces: [
      'tradle.Message'
    ],
    properties: {}
  }

  for (let p in stylesPackModel.properties) {
    model.properties[p] = stylesPackModel.properties[p]
  }

  validate.model(model)
  return model
}
