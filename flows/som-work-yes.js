const { sendMessage, inviteUserToChannel } = require('../utils/utils')

const loadFlow = app => {
  app.action('work_yes', async ({ ack, body }) => {
    await ack()
    await updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Do you know what you want to work on?`, 'Yes', 'mimmiggie')
    await sendMessage(app, body.channel.id, `I just invited you to <#C015M4L9AHW>—welcome yourself!`)
    await inviteUserToChannel(app, body.user.id, 'C015M4L9AHW')
  })
}
exports.loadFlow = loadFlow