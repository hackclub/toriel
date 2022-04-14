const { client } = require('../app')

async function inviteUserToChannel(
  user,
  channel,
  doAsAdmin = false,
  notInChannel = false
) {
  console.log('inviting', user, 'to', channel)

  if (notInChannel) {
    await client.conversations.join({ channel })
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
      if (!notInChannel && error.data.error === 'not_in_channel') {
        return inviteUserToChannel(user, channel, doAsAdmin, true)
      }
      console.log(err.data.error)
    })
}

module.exports = { inviteUserToChannel }
