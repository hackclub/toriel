const { transcript } = require("../util/transcript")

function increaseRummageCount() {
  const rummageCount = parseInt(process.env.RUMMAGE_COUNT) || 0
  process.env.RUMMAGE_COUNT = rummageCount + 1
  return rummageCount
}

const rummageChannel = process.env.RUMMAGE_CHANNEL

async function handleRummage(args) {
  const { client, payload } = args
  const { user, text, channel } = payload

  if (channel !== rummageChannel) {
    console.log('not in announcements channel')
    return
  }

  const rummageThread = process.env.RUMMAGE_THREAD
  console.log("saved rummage thread is ", rummageThread)

  if (!rummageThread) {
    console.log('no rummage thread')
    return
  }

  if (text !== 'RUMMAGE') {
    console.log('not rummage')
    return
  }

  const messageCount = increaseRummageCount()

  let message = ''
  if (messageCount < 10) {
    message = transcript('rummage.first-ten')
  } else if (messageCount < 200) {
    message = transcript('rummage.first-hundred')
  } else if (messageCount < 400) {
    message = transcript('rummage.second-hundred')
  } else if (messageCount < 600) {
    message = transcript('rummage.third-hundred')
  } else {
    message = transcript('rummage.end')
  }


  await client.chat.postMessage({
    text: `<@${user}>: ${message}`,
    channel: rummageChannel,
    thread_ts: rummageThread,
    username: `A ${transcript('rummage.raccoon-types')} racoon`.toUpperCase(),
    icon_url: transcript('rummage.avatar.raccoon'),
  })
}

module.exports = { handleRummageInteraction: handleRummage }