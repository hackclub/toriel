const { client } = require('../app')
const { metrics } = require('./metrics')

async function inviteUserToChannel(
  user,
  channel,
  doAsAdmin = false,
  notInChannel = false
) {
  console.log('inviting', user, 'to', channel)

  if (notInChannel) {
    try {
      await client.conversations.join({ channel })
    } catch (e) {}
  }

  const token = doAsAdmin
    ? process.env.SLACK_LEGACY_TOKEN
    : process.env.SLACK_BOT_TOKEN
  return await client.conversations
    .invite({
      token: token,
      channel: channel,
      users: user,
    })
    .catch((err) => {
      if (err.data.error === 'already_in_channel') {
        console.log(`${user} is already in ${channel}—skipping this step...`)
      }
      if (!notInChannel && err.data.error === 'not_in_channel') {
        metrics.increment('events.flow.addtochannel', 1)
        return inviteUserToChannel(user, channel, doAsAdmin, true)
      }
      console.log(err.data.error, 'while inviting', user, 'to', channel)
    })
}

module.exports = { inviteUserToChannel }
