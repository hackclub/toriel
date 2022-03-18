const { sleep } = require("../util/sleep");
const { transcript } = require("../util/transcript");

async function join(args) {
  const { client, payload } = args
  const { user, channel } = payload
  await client.chat.postEphemeral({
    text: transcript('cave-join', { user }),
    channel,
    user,
  })

  await sleep(3 * 1000)

  await client.chat.postMessage({
    text: transcript('house.start'),
    channel: user, // this will send as a DM
  })
}
module.exports = { joinInteraction: join }