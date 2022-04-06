const { transcript } = require('../util/transcript')

async function startup(app) {
  await app.client.chat.postMessage({
    text: transcript('startup.message'),
    channel: transcript('channels.bot-spam'),
    username: 'TUTORIEL',
    icon_url: transcript('startup.avatar'),
    unfurl_links: false,
    unfurl_media: false,
  })
}

module.exports = { startupInteraction: startup }
