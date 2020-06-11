const { setFlow, sendDoubleBlockMessage } = require('../utils/utils')

const loadFlow = app => {
  app.action('buildhardware_no', async ({ ack, body }) => {
    await ack()
    await setFlow(body.user.id, 'SOM - Build Hardware No')
    await sendDoubleBlockMessage(app, body.channel.id, `Do you know what you want to work on?`, 'Yes', 'No', 'work_yes', 'work_no')
  })
}
exports.loadFlow = loadFlow