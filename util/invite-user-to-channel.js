async function inviteUserToChannel(client, user, channel, doAsAdmin = false) {
  console.log('inviting', user, 'to', channel)

  const token = doAsAdmin
    ? process.env.SLACK_LEGACY_TOKEN
    : process.env.SLACK_BOT_TOKEN
  await client.conversations
    .invite({
      token: token,
      channel: channel,
      users: user,
    })
    .catch((err) => {
      if (err.data.error === 'already_in_channel') {
        console.log(`${user} is already in ${channel}—skipping this step...`)
      }
      console.log(err.data.error)
    })
}

module.exports = { inviteUserToChannel }
