const { transcript } = require("../util/transcript");

async function join(args) {
  const { client, payload } = args
  const { user, channel } = payload
  await client.chat.postEphemeral({
    text: transcript('cave-join', { user }),
    channel,
    user,
  })
}
module.exports = { joinInteraction: join }