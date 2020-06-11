const { sendMessage, inviteUserToChannel } = require('../utils/utils')

const loadFlow = app => {
  app.action('needhardware_yes', async ({ ack, body }) => {
    await ack()
    await sendMessage(app, body.channel.id, `https://hackclub.com Here's a link to the hardware request form`)
    await sendMessage(app, body.channel.id, `I just invited you to #welcome and #summer-of-making—introduce yourself to the community!`)
    await inviteUserToChannel(app, body.user.id, 'C015M4L9AHW')
    await inviteUserToChannel(app, body.user.id, 'C75M7C0SY')
  })
}
exports.loadFlow = loadFlow