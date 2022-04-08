require('dotenv').config()
const { inviteUserToChannel } = require('./util/invite-user-to-channel')
const { mirrorMessage } = require('./util/mirror-message')
const { transcript } = require('./util/transcript')
const { upgradeUser } = require('./util/upgrade-user')
const {
  postWelcomeCommittee,
} = require('./interactions/post-welcome-committee')
const express = require('express')

const { app } = require('./app.js')
const { receiver } = require('./express-receiver')

receiver.router.use(express.json())

receiver.router.get('/', require('./endpoints/index'))

receiver.router.get('/ping', require('./endpoints/ping'))

receiver.router.get(
  '/slack-tutorial/:user',
  require('./endpoints/slack-tutorial')
)

receiver.router.post('/slack-invite', require('./endpoints/slack-invite'))

app.event('message', async (args) => {
  // begin the firehose
  const { body, client } = args
  const { event } = body
  const { type, subtype, user, channel, ts, text } = event

  if (
    text?.toLowerCase()?.includes('toriel') ||
    text?.includes(transcript('selfUserID'))
  ) {
    mirrorMessage({
      message: text,
      user,
      channel,
      type,
    })
  }

  if (type == 'message' && channel == transcript('channels.cave')) {
    console.log(`Attempting to remove ${subtype} message in #cave channel`)
    await client.chat
      .delete({
        token: process.env.SLACK_LEGACY_TOKEN, // sudo
        channel,
        ts,
      })
      .catch((e) => {
        console.warn(e)
      })
  }
})

app.command(/.*?/, async (args) => {
  const { ack, payload, respond } = args
  const { command, text, user_id, channel_id } = payload

  try {
    mirrorMessage({
      message: `${command} ${text}`,
      user: user_id,
      channel: channel_id,
      type: 'slash-command',
    })

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
        await require(`./commands/restart`)(args)
        break

      case '/toriel-call':
        await require(`./commands/call`)(args)
        break

      default:
        await require('./commands/not-found')(args)
        break
    }
  } catch (e) {
    console.error(e)
  }
})

app.action(/.*?/, async (args) => {
  const { ack, respond, payload, client, body } = args
  const user = body.user.id

  mirrorMessage({
    message: `_<@${user}> clicked '${payload.text.text}'_`,
    user: user,
    channel: body.container.channel_id,
    type: body.type,
  })

  await ack()

  switch (payload.value) {
    case 'cave_start':
      const { joinCaveInteraction } = require('./interactions/join-cave')
      await joinCaveInteraction({ ...args, payload: { user } })
      break
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
            text: "I'm done reading this book",
            value: 'coc_complete',
          }),
        ],
        channel: user,
      })
      break
    case 'coc_complete':
      await respond({
        replace_original: true,
        text: '✅ Done with reading the Code of Conduct in the library',
      })
      await client.chat.postMessage({
        text: transcript('house.leave'),
        blocks: [
          transcript('block.text', { text: transcript('house.leave') }),
          transcript('block.single-button', {
            text: 'Continue',
            value: 'house_leave',
          }),
        ],
        channel: user,
      })
      break
    case 'house_leave':
      await upgradeUser(user)

      const defaultChannels = [
        'code',
        'confessions',
        'counttoamillion',
        'hack-night',
        'hq',
        'lounge',
        'neighborhood',
        'pasture',
        'poll-of-the-day',
        'question-of-the-day',
        'scrapbook',
        'ship',
      ]
      await Promise.all([
        ...defaultChannels.map((c) =>
          inviteUserToChannel(user, transcript(`channels.${c}`))
        ),
        respond({
          replace_original: true,
          text: `✅ You left TORIEL's house and stepped in to town...`,
        }),
        postWelcomeCommittee(user),
      ])

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

app.start(process.env.PORT || 3000).then(async () => {
  console.log(transcript('startupLog'))

  const { ensureSlackChannels } = require('./interactions/ensure-channels')
  await ensureSlackChannels()

  const { cleanupCaveChannel } = require('./interactions/cleanup-cave')
  await cleanupCaveChannel()

  if (process.env.NODE_ENV === 'production') {
    const { startupInteraction } = require('./interactions/startup')
    await startupInteraction()
  }

  /* DEVELOPMENT UTILITIES (uncomment to use) */
  const { setupCaveChannel } = require('./setup/cave-channel')
  // await setupCaveChannel(app)
})

module.exports = { app }
