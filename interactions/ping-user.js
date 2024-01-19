const { client } = require('../app')
const { transcript } = require('../util/transcript')

// Sends an ephemeral message to a user in the #cave channel right after they join

async function pingUserInteraction({ user }) {
  await client.chat.postEphemeral({
    text: transcript('cave-ping', { user }),
    channel: transcript('channels.cave'),
    user,
    icon_url: transcript('avatar.log'),
  })
}

module.exports = { pingUserInteraction }
