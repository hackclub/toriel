const { client } = require('../app')
const { transcript } = require('../util/transcript')

async function cleanupCaveChannel(dryRun = true) {
  const channel = transcript('channels.cave-a')
  const data = await client.conversations.history({
    channel,
  })
  const { messages } = data

  const selfUserID = transcript('selfUserID')
  const messagesToRemove = messages.filter((message) => {
    return message.user != selfUserID
  })

  if (dryRun) {
    console.log(
      `[DRY RUN] Found ${messagesToRemove.length} message(s) from other users in #cave channel, run with dryRun=false to remove`
    )
  } else {
    console.log(
      `Found ${messagesToRemove.length} message(s) from other users in #cave channel, cleaning up...`
    )
    await Promise.all(
      messagesToRemove.map((message) =>
        client.chat
          .delete({
            token: process.env.SLACK_LEGACY_TOKEN, // sudo
            channel,
            ts: message?.ts,
            thread_ts: message?.thread_ts,
          })
          .catch((e) => {
            console.warn(e)
          })
      )
    )
  }
}

module.exports = { cleanupCaveChannel }
