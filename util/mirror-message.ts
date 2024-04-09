const { transcript } = require('./transcript')
const { client } = require('../app')

async function mirrorMessage({ message, user, channel, type }) {
  try {
    const context = `a ${type} from <@${user}> in <#${channel}>`
    await client.chat.postMessage({
      channel: transcript('channels.toriels-diary'),
      text: context,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `> ${message}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: context,
            },
          ],
        },
      ],
    })
  } catch (e) {
    console.error(e)
  }
}

module.exports = { mirrorMessage }
