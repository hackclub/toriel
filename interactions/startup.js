const { transcript } = require("../util/transcript")

async function startup(app) {
  await app.client.chat.postMessage({
    text: transcript('startup.message'),
    channel: transcript('channels.bot-spam'),
    username: 'TUTORIEL',
    icon_url: transcript('startup.avatar'),
    unfurl_links: false,
    unfurl_media: false,
  })
  // await app.client.chat.postMessage({
  //   text: '`cinnamon and butterscotch pie up and running on port 3000`',
  //   channel: transcript('channels.bot-spam'),
  //   icon_url: transcript('avatar.default'),
  //   username: 'TORIEL'
  // })
  // sleep(1000)
  // await app.client.chat.postMessage({
  //   text: "`don't *pie'nd* if i do!`",
  //   channel: transcript('channels.bot-spam'),
  //   icon_url: transcript('avatar.sans'),
  //   username: 'sans'
  // })
  // sleep(1000)
  // await app.client.chat.postMessage({
  //   text: ':blank:',
  //   channel: transcript('channels.bot-spam'),
  //   icon_url: transcript('avatar.grumpy'),
  //   username: 'TORIEL'
  // })
}

module.exports = { startupInteraction: startup }