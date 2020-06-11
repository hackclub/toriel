const { sendMessage, inviteUserToChannel, updateSingleBlockMessage } = require('../utils/utils')

const loadFlow = app => {
  app.action('needhardware_no', async ({ ack, body }) => {
    await ack()
    await updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Do you know what hardware you need for your project?`, 'No', 'mimmiggie')
    await sendMessage(app, body.channel.id, `I just added you to #som-help, where we can help you find the hardware you need for your project.`)
    //await inviteUserToChannel(#som-help)
  })
}
exports.loadFlow = loadFlow