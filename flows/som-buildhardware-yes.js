const { setFlow, sendDoubleBlockMessage, updateSingleBlockMessage } = require('../utils/utils')

const loadFlow = app => {
  app.action('buildhardware_yes', async ({ ack, body }) => {
    await ack()
    await setFlow(body.user.id, 'SOM - Build Hardware Yes')
    await updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Are you building a hardware project during the Summer of Making?`, 'Yes', 'mimmiggie')
    await sendDoubleBlockMessage(app, body.channel.id, `Do you know what hardware you need for your project?`, 'Yes', 'No', 'needhardware_yes', 'needhardware_no')
  })
}
exports.loadFlow = loadFlow