const { sleep } = require("../util/sleep")
const { transcript } = require("../util/transcript")

const rummageChannel = process.env.RUMMAGE_CHANNEL

async function initRummage(args) {
  const { client, payload } = args
  const { user } = payload

  // ensure only triggered by the right user

  if (user !== 'U0C7B14Q3') { return }

  const topLevelMessage = await client.chat.postMessage({
    text: transcript('rummage.announcements.init'),
    channel: rummageChannel,
    username: 'Trash can',
    icon_url: transcript('rummage.avatar.trashcan'),
  })

  const { ok, ts } = topLevelMessage
  if (!ok) {
    // oh no...
    console.log({topLevelMessage})
    return
  }

  const threadID = ts

  process.env.RUMMAGE_THREAD = threadID
  console.log('RUMMAGE_THREAD', process.env.RUMMAGE_THREAD)

  await sleep(10000)

  await client.chat.postMessage({
    text: transcript('rummage.announcements.raccoon-init'),
    channel: rummageChannel,
    thread_ts: process.env.RUMMAGE_THREAD,
    username: "A YAPPY RACCOON",
    icon_url: transcript('rummage.avatar.raccoon'),
  })

  await sleep(10000)

  await client.chat.postMessage({
    blocks: [
      transcript('block.text', { text: transcript('rummage.announcements.raccoon-rummage') }),
      transcript('block.context', { text: transcript('rummage.announcements.raccoon-join') }),
    ],
    channel: rummageChannel,
    thread_ts: process.env.RUMMAGE_THREAD,
    username: "A LOUD RACCOON",
    icon_url: transcript('rummage.avatar.raccoon'),
  })
}

module.exports = { initRummageInteraction: initRummage }