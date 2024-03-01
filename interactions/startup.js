const { client } = require('../app')
const { transcript } = require('../util/transcript')
const { metrics } = require('../util/metrics')

function getEnv() {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
}
function getVersion() {
  // https://devcenter.heroku.com/articles/dyno-metadata
  const versionData = [process.env.HEROKU_RELEASE_VERSION, process.env.HEROKU_SLUG_COMMIT]
  if (versionData) {
    return versionData.map(t => t.slice(0, 8)).join('-')
  } else {
    return 'local'
  }
}

async function startup() {
  metrics.increment('events.startup', 1)
  await client.chat.postMessage({
    blocks: [
      transcript('block.text', { text: transcript('startup.message') }),
      transcript('block.context', { text: `${getEnv()}-${getVersion()}` })
    ],
    channel: transcript('channels.bot-spam'),
    username: 'TUTORIEL',
    icon_url: transcript('startup.avatar'),
    unfurl_links: false,
    unfurl_media: false,
  })
}

module.exports = { startupInteraction: startup }
