const { client } = require('../app')

// Check if a channel has activity within a set time, if not, return false
// "since" should be a duration in ms and defaults to 1 day
async function channelIsActive({ channelName, since = 1000 * 60 * 60 * 24 }) {
  const channel = transcript(`channels.${channelName}`)
  const data = await client.conversations.history({
    channel,
    oldest: Date.now() - since,
    inclusive: true,
  })
  const { messages } = data
  return messages.length > 0
}
module.exports = { channelIsActive }
