const fetch = require('node-fetch')
const { transcript } = require('../util/transcript')

async function ensureBasementMessage(app) {
  const result = await app.client.conversations.history({
    channel: transcript('channels.the-basement'),
  })

  conversationHistory = result.messages

  if (conversationHistory.length == 0) {
    console.warn('⚠️ basement channel has no messages')
    app.client.chat.postMessage({
      channel: transcript('channels.the-basement'),
      text: transcript('basement-text'),
      blocks: [
        {
          type: 'image',
          image_url: transcript('basement-image'),
          title: 'You find yourself at the entrance to a corridor',
          alt_text: 'You find yourself at the entrance to a corridor',
        },
      ],
    })

    const axios = require('axios')
    const file = await axios({
      method: 'get',
      url: transcript('files.basement-audio'),
      responseType: 'stream',
    })
    console.log({ file, keys: Object.keys(file) })
    const response = await app.client.files.upload({
      channels: transcript('channels.bot-spam'),
      file: file.data,
      filename: 'play me',
      filetype: 'm4a',
    })
  } else if (conversationHistory.length > 1) {
    console.warn('⚠️ basement channel has more than 1 message')
  }
}

module.exports = { ensureBasementMessage }
