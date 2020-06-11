const { sendMessage, inviteUserToChannel } = require('../../utils/utils')

const loadFlow = app => {
  app.action('work_yes', async ({ ack, body }) => {
    await ack()
    await sendMessage(app, body.channel.id, `I just invited you to <#C015M4L9AHW>—welcome yourself!`)
    await inviteUserToChannel(app, body.user.id, 'C015M4L9AHW')
  })
}
exports.loadFlow = loadFlow