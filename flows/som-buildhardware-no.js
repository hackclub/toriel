const { setFlow, sendDoubleBlockMessage, updateSingleBlockMessage,
  sendMessage } = require('../utils/utils')

const loadFlow = app => {
  app.action('buildhardware_no', async ({ ack, body }) => {
    await ack()
    await setFlow(body.user.id, 'SOM - Build Hardware No')
    await updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Are you building a hardware project during the Summer of Making?`)
    await sendMessage(app, body.channel.id, '...', 1000)
    await sendMessage(app, body.channel.id, '...', 1000)
    await sendDoubleBlockMessage(app, body.channel.id, `Do you know what you want to work on?`, 'Yes', 'No', 'work_yes', 'work_no')
  })
}
exports.loadFlow = loadFlow