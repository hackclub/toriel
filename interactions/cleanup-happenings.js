const { client } = require('../app')
const { transcript } = require('../util/transcript')

async function cleanupHappeningsChannel(dryRun = true) {
  const channel = transcript('channels.happenings')
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
      `[DRY RUN] Found ${messagesToRemove.length} message(s) from other users in #happenings channel, run with dryRun=false to remove`
    )
  } else {
    console.log(
      `Found ${messagesToRemove.length} message(s) from other users in #happenings channel, cleaning up...`
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

module.exports = { cleanupHappeningsChannel }
