const { client } = require('../app')
const { transcript } = require('../util/transcript')
const { metrics } = require('../util/metrics')

function getEnv() {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
}

async function startup() {
  await client.chat.postMessage({
    blocks: [transcript('block.text', { text: transcript('startup.message') })],
    channel: transcript('channels.bot-spam'),
    username: 'TUTORIEL',
    icon_url: transcript('startup.avatar'),
    unfurl_links: false,
    unfurl_media: false,
  })
}

module.exports = { startupInteraction: startup }
