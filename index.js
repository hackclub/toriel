const { App } = require('@slack/bolt')
const { transcript } = require('./util/transcript')

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

app.event('member_joined_channel', async (args) => {
  const { channel } = args.event
  switch (channel) {
    case transcript('channels.cave'):
      const { joinInteraction } = require('./interactions/join')
      await joinInteraction(args)
      break

    case transcript('channels.the-basement'):
      const { joinBasementInteraction } = require('./interactions/join-basement')
      await joinBasementInteraction(args)
      break

    default:
      console.log(`Ignoring join in ${channel}`)
      break
  }
})

app.command(/\/.*/, async (args) => {
  const { ack, payload, respond } = args
  const { command, text } = payload

  await ack()

  await respond({
    blocks: [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${command} ${text}`,
          },
        ],
      },
    ],
  })

  switch (command) {
    case '/toriel-restart':
      await require(`./commands/restart`)(args, app)
      break

    case '/toriel-call':
      await require(`./commands/call`)(args, app)
      break

    default:
      await require('./commands/not-found')(args, app)
      break
  }
})

var botSelfCache
async function botInfo() {
  return botSelfCache
    ? botSelfCache
    : (botSelfCache = await app.client.bots.info({
        token: process.env.SLACK_BOT_TOKEN,
      }))
}

app.start(process.env.PORT || 3000).then(async () => {
  console.log(transcript('startupLog'))

  const { ensureSlackChannels } = require('./interactions/ensure-channels')
  await ensureSlackChannels(app)

  const { startupInteraction } = require('./interactions/startup')
  await startupInteraction(app)
})
