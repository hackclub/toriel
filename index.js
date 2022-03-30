require('dotenv').config()
const { App } = require('@slack/bolt')
const { inviteUserToChannel } = require('./util/invite-user-to-channel')
const { transcript } = require('./util/transcript')

// console.log({hello: process.env.SLACK_BOT_TOKEN})
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

app.event('message', async (args) => {
  // begin the firehose
  const { body } = args
  const { event } = body
  const { type, subtype, channel, ts } = event
  if (type=="message" && channel == transcript('channels.cave')) {
    console.log(`Attempting to remove ${subtype} message in #cave channel`)
    try {
      args.client.chat.delete({
        token: process.env.SLACK_LEGACY_TOKEN, // sudo
        channel,
        ts,
      })
    } catch (e) {
      console.warn(e)
    }
  }
})

app.event('member_joined_channel', async (args) => {
  const { channel } = args.event
  switch (channel) {
    case transcript('channels.cave'):
      const { joinInteraction } = require('./interactions/join-cave')
      await joinInteraction(args)
      break

    case transcript('channels.the-basement'):
      const {
        joinBasementInteraction,
      } = require('./interactions/join-basement')
      await joinBasementInteraction(args)
      break

    default:
      console.log(`Ignoring join in ${channel}`)
      break
  }
})

app.command(/.*?/, async (args) => {
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

app.action(/.*?/, async (args) => {
  const { ack, respond, payload, client, body } = args
  // const { user } = body
  const user = body.user.id
  // const { user, channel } = payload

  await ack()

  switch (payload.value) {
    // case 'bedroom_button':
    //   await respond({
    //     replace_original: true,
    //     text: transcript("buttons.bedroom")
    //   })
    //   break
    // case 'kitchen_button':
    //   await respond({
    //     replace_original: true,
    //     text: transcript("buttons.kitchen")
    //   })
    //   break
    // case 'basement_button':
    //   await respond({
    //     replace_original: true,
    //     text: transcript("buttons.basement")
    //   })
    //   break

    case 'theme_complete':
      await respond({
        replace_original: true,
        text: '✅ Done with themes',
      })
      await client.chat.postMessage({
        text: transcript('house.coc'),
        unfurl_links: false,
        unfurl_media: false,
        channel: user,
        // icon_url: transcript('avatar.default'),
      })
      await client.chat.postMessage({
        blocks: [
          transcript('block.single-button', {
            text: 'Continue',
            value: 'coc_complete',
          }),
        ],
        channel: user,
      })
      break
    case 'coc_complete':
      await respond({
        replace_original: true,
        text: '✅ Done with CoC',
      })
      await client.chat.postMessage({
        text: transcript('house.game'),
        unfurl_links: false,
        unfurl_media: false,
        channel: user,
      })
      await Promise.all([
        inviteUserToChannel(client, user, transcript('channels.tetris'), true),
        inviteUserToChannel(
          client,
          user,
          transcript('channels.whack-a-mole'),
          true
        ),
        inviteUserToChannel(
          client,
          user,
          transcript('channels.the-basement'),
          true
        ),
      ])
      await client.chat.postMessage({
        blocks: [
          transcript('block.single-button', {
            text: 'Continue',
            value: 'game_complete',
          }),
        ],
        channel: user,
      })
      break

    default:
      await respond({
        replace_original: false,
        text: transcript('errors.not-found'),
      })
      console.log({ args })
      break
  }
})

// app.action({action_id: 'kitchen_button'}, async ({ body, ack, say, respond }) => {
//   console.log('button_click')
//   // Acknowledge the action
//   await ack()
//   // await say(`<@${body.user.id}> clicked the button`)
//   await respond({
//     replace_original: true,
//     text: `<@${body.user.id}> clicked the button`
//   })
// })

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

  const {
    ensureBasementMessage,
  } = require('./interactions/ensure-basement-message')
  await ensureBasementMessage(app)

  const { startupInteraction } = require('./interactions/startup')
  await startupInteraction(app)

  /* DEVELOPMENT UTILITIES */
  const { setupBasementChannel } = require('./setup/basement-channel')
  // await setupBasementChannel(app)
  const { setupCaveChannel } = require('./setup/cave-channel')
  // await setupCaveChannel(app)

  const { inviteUser } = require('./util/invite-user')
  // inviteUser('29yu8w@hack.af')
})
