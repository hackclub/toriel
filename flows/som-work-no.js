const { sendMessage, inviteUserToChannel } = require('../utils/utils')

const loadFlow = app => {
  app.action('work_no', async ({ ack, body }) => {
    await ack()
    await updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Do you know what you want to work on?`, 'No', 'mimmiggie')
    await sendMessage(app, body.channel.id, `I just invited you to #som-help, where you can get help`)
    //await inviteUserToChannel(#som-help)
    await sendMessage(app, body.channel.id, `I also invited you to <#C015M4L9AHW>. Yay welcome to summer of making!`)
    await inviteUserToChannel(app, body.user.id, 'C015M4L9AHW')
  })
}
exports.loadFlow = loadFlow