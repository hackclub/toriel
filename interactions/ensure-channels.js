const { client } = require('../app')
const { transcript } = require('../util/transcript')

async function ensureChannels() {
  const data = await client.users.conversations()
  const currentChannelIDs = data.channels.map((c) => c.id)
  const testChannelIDs = [
    transcript('channels.toriels-diary'),
    transcript('channels.cave'),
    transcript('channels.the-basement'),
    transcript('channels.bot-spam'),
    // default channels:
    transcript('channels.lounge'),
    transcript('channels.code'),
    transcript('channels.hack-night'),
    transcript('channels.question-of-the-day'),
    transcript('channels.confessions'),
    transcript('channels.neighborhood'),
    transcript('channels.ship'),
    transcript('channels.scrapbook'),
    transcript('channels.counttoamillion'),
    transcript('channels.leaders'),
    transcript('channels.hq'),
    transcript('channels.8-ball'),
    transcript('channels.leaders'),
  ]

  let missingChannels = []
  testChannelIDs.forEach((testID) => {
    let found = currentChannelIDs.indexOf(testID) > -1
    if (!found) {
      missingChannels.push(testID)
    }
  })
  if (missingChannels.length === 0) {
    console.log('Toriel is in all channels she should have access to')
  } else {
    console.warn('⚠️Toriel is not invited to these channels:', missingChannels)
  }
}

module.exports = { ensureSlackChannels: ensureChannels }
