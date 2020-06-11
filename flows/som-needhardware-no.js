const { sendMessage, inviteUserToChannel } = require('../utils/utils')

const loadFlow = app => {
  app.action('needhardware_no', async ({ ack, body }) => {
    await ack()
    await sendMessage(app, body.channel.id, `I just added you to #som-help, where we can help you find the hardware you need for your project.`)
    //await inviteUserToChannel(#som-help)
  })
}
exports.loadFlow = loadFlow