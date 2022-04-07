require('dotenv').config()
const { App, ExpressReceiver } = require('@slack/bolt')
const { inviteUserToChannel } = require('./util/invite-user-to-channel')
const { mirrorMessage } = require('./util/mirror-message')
const { transcript } = require('./util/transcript')
const { upgradeUser } = require('./util/upgrade-user')
const { inviteUser } = require('./util/invite-user')
const {
  postWelcomeCommittee,
} = require('./interactions/post-welcome-committee')
const express = require('express')
const { prisma } = require('./db')

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})
receiver.router.use(express.json())

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
})

receiver.router.get('/ping', (req, res) => {
  res.json({ pong: true })
})

receiver.router.get('/slack-tutorial/:user', async (req, res) => {
  // this endpoint is hit by @clippy in the Slack to check if @toriel is handling the onboarding
  // if we return false, @clippy will step in and onboard the user
  console.log({params: req.params})
  const { user } = req.params
  const slackuser = await app.client.users.info({ user })
  const email = slackuser?.user?.profile?.email
  const invite = await prisma.invite.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    invite: Boolean(invite)
  })
})

receiver.router.post('/slack-invite', async (req, res) => {
  // this endpoint is hit by the form on hackclub.com/slack
  try {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' })
    }
    if (req.headers.authorization != `Bearer ${process.env.AUTH_TOKEN}`) {
      return res.status(403).json({ error: 'Invalid credentials sent!' })
    }

    const email = req?.body?.email
    const result = { email }
    if (email) {
      const { ok, error } = await inviteUser(req.body)
      result.ok = ok
      result.error = error
    }
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ ok: false, error: 'a fatal error occurred' })
  }
})

app.event('message', async (args) => {
  // begin the firehose
  const { body, client } = args
  const { event } = body
  const { type, subtype, user, channel, ts, text } = event

  if (
    text?.toLowerCase()?.includes('toriel') ||
    text?.includes(transcript('selfUserID'))
  ) {
    console.log('i was mentioned!')
    mirrorMessage(client, {
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
    mirrorMessage(app.client, {
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
        await require(`./commands/restart`)(args, app)
        break

      case '/toriel-call':
        await require(`./commands/call`)(args, app)
        break

      default:
        await require('./commands/not-found')(args, app)
        break
    }
  } catch (e) {
    console.error(e)
  }
})

app.action(/.*?/, async (args) => {
  const { ack, respond, payload, client, body } = args
  const user = body.user.id

  mirrorMessage(client, {
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
      await upgradeUser(app.client, user)

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
          inviteUserToChannel(app.client, user, transcript(`channels.${c}`))
        ),
        respond({
          replace_original: true,
          text: `✅ You left TORIEL's house and stepped in to town...`,
        }),
        postWelcomeCommittee(app.client, user),
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
  await ensureSlackChannels(app)

  const { cleanupCaveChannel } = require('./interactions/cleanup-cave')
  await cleanupCaveChannel(app)

  if (process.env.NODE_ENV === 'production') {
    const { startupInteraction } = require('./interactions/startup')
    await startupInteraction(app)
  }

  /* DEVELOPMENT UTILITIES (uncomment to use) */
  const { setupCaveChannel } = require('./setup/cave-channel')
  // await setupCaveChannel(app)
})
