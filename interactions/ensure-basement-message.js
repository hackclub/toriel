const { transcript } = require("../util/transcript");

async function ensureBasementMessage(app) {

  const result = await app.client.conversations.history({
    channel: transcript('channels.the-basement')
  })

  conversationHistory = result.messages

  if (conversationHistory.length == 0) {
    console.warn('⚠️ basement channel has no messages')
  } else if (conversationHistory.length > 1) {
    console.warn('⚠️ basement channel has more than 1 message')
  }
}

module.exports = { ensureBasementMessage }