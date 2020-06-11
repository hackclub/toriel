const { setFlow, sendDoubleBlockMessage } = require('../utils/utils')

const loadFlow = app => {
  app.action('buildhardware_yes', async ({ ack, body }) => {
    await ack()
    await setFlow(body.user.id, 'SOM - Build Hardware Yes')
    await sendDoubleBlockMessage(app, body.channel.id, `Do you know what hardware you need for your project?`, 'Yes', 'No', 'needhardware_yes', 'needhardware_no')
  })
}
exports.loadFlow = loadFlow