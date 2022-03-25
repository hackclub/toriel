// the user joins #the-basement

const { transcript } = require("../util/transcript")

async function joinBasement(args) {
  const { client, payload } = args
  const { user, channel } = payload
  await client.chat.postEphemeral({
    text: transcript('basement-join', { user }),
    blocks: [
      {
        "type":"section",
        "text":{
          "type":"plain_text",
          "text": transcript('basement-join', { user })
        }
      },
      transcript('room-button-blocks')
    ],
    channel: transcript('channels.the-basement'),
    user,
    icon_url: transcript('avatar.sad')
  })
}
module.exports = { joinBasementInteraction: joinBasement }