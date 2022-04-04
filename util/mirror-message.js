const { transcript } = require("./transcript");

async function mirrorMessage(client, {message, user, channel, type}) {
  const context = `a ${type} from <@${user}> in <#${channel}>`
  await client.chat.postMessage({
    channel: transcript('channels.toriels-diary'),
    text: context,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `> ${message}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: context
          }
        ]
      }
    ]
  })
}

module.exports = { mirrorMessage }