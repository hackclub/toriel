// the user joins #the-basement

const { transcript } = require("../util/transcript")

async function joinBasement(args) {
  const { client, payload } = args
  const { user, channel } = payload
  await client.chat.postEphemeral({
    text: transcript('basement-join', { user }),
    channel: transcript('channels.the-basement'),
    user,
    icon_url: transcript('avatar.sad')
  })
}
module.exports = { joinBasementInteraction: joinBasement }