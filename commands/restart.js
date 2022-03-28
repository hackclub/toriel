const { joinInteraction } = require('../interactions/join-cave')
const { transcript } = require('../util/transcript')

async function restart(args) {
  const { payload, client, respond } = args
  const { user_id, text } = payload

  let userToReset = user_id

  const userRegex = /<@([A-Za-z0-9]+)\|.+>/i
  const userMatches = text.match(userRegex)
  const foundUser = userMatches ? userMatches[1] : null
  if (foundUser && foundUser != '') {
    const callingUser = await client.users.info({
      user: user_id,
    })

    if (callingUser.user.is_admin || callingUser.user.is_owner) {
      userToReset = foundUser

      respond({
        text: `resetting <@${userToReset}>`,
      })
    } else {
      // no permissions– skip
      respond({
        text: 'Only admins and owners can reset another user',
      })
      return null
    }
  } else {
    respond({
      text: `resetting your tutorial...`,
    })
  }

  await client.chat.postMessage({
    text: 'restarting...',
    channel: userToReset,
    // icon_url: transcript('startup.avatar')
  })

  const joinArgs = args
  joinArgs.payload.channel = transcript('channels.cave')
  joinArgs.payload.user = userToReset
  joinInteraction(args)
}
module.exports = restart
