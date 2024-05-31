require('dotenv').config()
const { inviteUserToChannel } = require('./util/invite-user-to-channel')
const { mirrorMessage } = require('./util/mirror-message')
const { transcript } = require('./util/transcript')
const {
  postWelcomeCommittee,
} = require('./interactions/post-welcome-committee')
const express = require('express')

const { app, client } = require('./app.js')
const { receiver } = require('./express-receiver')
const { getInvite } = require('./util/get-invite')
const { sleep } = require('./util/sleep')
const { prisma } = require('./db')
const { metrics } = require('./util/metrics')
const { upgradeUser } = require('./util/upgrade-user.js')
const { destroyHelpMeMessage } = require('./util/notify-channel.js')
const { scheduleHelpMeMessage } = require('./util/notify-channel')
const { sendInfo } = require('./util/alert')
receiver.router.use(express.json())

receiver.router.get('/', require('./endpoints/index'))

receiver.router.get('/ping', require('./endpoints/ping'))

receiver.router.get(
  '/start-from-clippy',
  require('./endpoints/start-from-clippy')
)

// Spit out global metrics every 5s
setInterval(() => {
  metrics.increment('events.pulse', 1)
}, 1000 * 5)

receiver.router.get(
  '/slack-tutorial/:user',
  require('./endpoints/slack-tutorial')
)

receiver.router.post('/slack-invite', require('./endpoints/slack-invite'))

const defaultChannels = ['lounge', 'scrapbook', 'happenings', 'ship', 'welcome']

const getSuggestion = () => {
  const suggestions = [
    `tell us how you're doing in <#${transcript('channels.lounge')}>`,
    `post your proudest ship in <#${transcript('channels.ship')}>`,
    `post a project you're currently working on in <#${transcript(
      'channels.scrapbook'
    )}>`,
    `post the next number in <#${transcript('channels.counttoamillion')}>`,
    `answer the latest question in <#${transcript(
      'channels.question-of-the-day'
    )}>`,
    `ask 8-ball your fortune for the coming week in <#${transcript(
      'channels.8-ball'
    )}>`,
    `share a photo of your surroundings in <#${transcript(
      'channels.surroundings'
    )}>`,
    `tell us what you're listening to in <#${transcript('channels.music')}>`,
  ]
  return suggestions[Math.floor(Math.random() * suggestions.length)]
}

app.event('message', async (args) => {
  // begin the firehose
  const { body, client } = args
  const { event } = body
  const { type, subtype, user, channel, ts, text } = event

  if (text === 'RUMMAGE') {
    mirrorMessage({
      message: text,
      user,
      channel,
      type: 'Rummage',
    })
    const {
      handleRummageInteraction,
    } = require('./interactions/handle-rummage')
    await handleRummageInteraction(args)
    // } else if (text == 'trigger rummage') {
    //   mirrorMessage({
    //     message: text,
    //     user,
    //     channel,
    //     type: "Rummage Init",
    //   })
    //   const { initRummageInteraction } = require('./interactions/init-rummage')
    //   await initRummageInteraction(args)
  }

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

  const protectedChannels = [transcript('channels.cave')]
  if (type == 'message' && protectedChannels.includes(channel)) {
    console.log(`Attempting to remove ${subtype} message in #cave channel`)
    metrics.increment('events.protectedChannel.deletions', 1)
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

  defaultAddsId = defaultChannels.map((e) => {
    return transcript(`channels.${e}`)
  }) // map all default channels into ids as channel prop is given as id

  if (
    subtype === 'channel_join' &&
    text === `<@${user}> has joined the channel` &&
    defaultAddsId.includes(channel)
  ) {
    console.log('Deleting "user has joined" message')

    const jobs = []
    jobs.push(
      client.chat
        .delete({
          token: process.env.SLACK_LEGACY_TOKEN, // sudo
          channel,
          ts,
        })
        .catch((e) => {
          console.warn(e)
        })
    )
    jobs.push(
      mirrorMessage({
        message: `<@${user}> has been dropped into cave`,
        user,
        channel,
        type,
      })
    )
    jobs.push(scheduleHelpMeMessage(client, user))

    await Promise.all(jobs)
  } // delete "user has joined" message if it is sent in one of the default channels that TORIEL adds new members to
})

const addToChannels = async (user, event) => {
  await upgradeUser(user)
  await sleep(1000) // timeout to prevent race-condition during channel invites
  const invite = await getInvite({ user })
  let channelsToInvite = defaultChannels
  if (event) {
    channelsToInvite.push(event)
    defaultChannels.push(event)
  }
  await Promise.all(
    channelsToInvite.map((c) =>
      inviteUserToChannel(user, transcript(`channels.${c}`))
    )
  )

  const suggestion = getSuggestion()
  await client.chat.postMessage({
    text: transcript('house.added-to-channels', { suggestion }),
    blocks: [
      transcript('block.text', {
        text: transcript('house.added-to-channels', { suggestion }),
      }),
    ],
    channel: user,
  })

  // TODO weigh by reactions or just do something else entirely
  const history = await client.conversations.history({
    channel: transcript('channels.ship'),
    limit: 10,
  })
  const message = history.messages[Math.floor(Math.random() * 10)]
  const link = (
    await client.chat.getPermalink({
      channel: transcript('channels.ship'),
      message_ts: message.ts,
    })
  ).permalink
}

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
        metrics.increment('events.restart', 1)
        break

      case '/toriel-call':
        await require(`./commands/call`)(args)
        break

      case '/toriel-reason':
        await require(`./commands/reason`)(args)
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
      const dbUser = await prisma.user.findFirst({ where: { user_id: user } })
      await joinCaveInteraction({ ...args, payload: { user } })

      if (!dbUser) {
        await postWelcomeCommittee(user)
      }
      break

    case 'coc_complete':
      const slackuser = await client.users.info({ user })
      const email = slackuser?.user?.profile?.email
      const invite = await prisma.invite.findFirst({ where: { email } })

      await prisma.user.update({
        where: {
          user_id: user,
        },
        data: {
          toriel_stage: 'ACCEPTED_COC',
        },
      })

      metrics.increment('events.acceptcoc', 1)

      if (invite?.event) {
        const event = invite?.event
        await prisma.user.update({
          where: { user_id: user },
          data: { club_leader: false },
        })
        await addToChannels(user, event)
      }
      await client.chat.postMessage({
        text: transcript('house.club-leader'),
        blocks: [
          transcript('block.text', { text: transcript('house.club-leader') }),
          transcript('block.double-button', [
            { text: 'yes', value: 'club_leader_yes' },
            { text: 'no', value: 'club_leader_no' },
          ]),
        ],
        channel: user,
      })
      break
    case 'club_leader_yes':
      await prisma.user.update({
        where: { user_id: user },
        data: { club_leader: true },
      })
      await client.chat.postMessage({
        text: transcript('club-leader.text'),
        channel: transcript('club-leader.notifiee'),
      })
      await addToChannels(user)
      // user upgrading from multi-channel to full user takes some time, so wait to prevent race conditions
      await sleep(5000)
      await inviteUserToChannel(user, transcript('channels.leaders'))
      await prisma.user.update({
        where: {
          user_id: user,
        },
        data: {
          toriel_stage: 'FINISHED',
        },
      })

      metrics.increment('events.flow.finish', 1)

      await destroyHelpMeMessage(client, user)

      break
    case 'club_leader_no':
      await prisma.user.update({
        where: { user_id: user },
        data: { club_leader: false },
      })
      await addToChannels(user)

      await prisma.user.update({
        where: {
          user_id: user,
        },
        data: {
          toriel_stage: 'FINISHED',
        },
      })

      metrics.increment('events.flow.finish', 1)

      await destroyHelpMeMessage(client, user)

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

app.start(process.env.PORT || 3001).then(async () => {
  console.log(transcript('startupLog'))

  const { ensureSlackChannels } = require('./interactions/ensure-channels')
  await ensureSlackChannels()

  const { cleanupCaveChannel } = require('./interactions/cleanup-cave')
  await cleanupCaveChannel()

  metrics.increment('events.startup', 1)

  const {
    cleanupHappeningsChannel,
  } = require('./interactions/cleanup-happenings')
  await cleanupHappeningsChannel()

  if (process.env.NODE_ENV === 'production') {
    const { startupInteraction } = require('./interactions/startup')
    await startupInteraction()
  }

  /* DEVELOPMENT UTILITIES (uncomment to use) */
  const { setupCaveChannel } = require('./setup/cave-channel')
  //  await setupCaveChannel(app)
})

setInterval(async function () {
  const noId = (
    await prisma.invite.findMany({
      where: {
        user_id: null,
      },
    })
  ).length
  metrics.gauge('flow.users.no_account', noId)

  const invitesThisWeek = (
    await prisma.invite.findMany({
      where: {
        createdAt: {
          lte: new Date(),
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })
  ).length

  console.log(invitesThisWeek)
  metrics.gauge('flow.users.invites.this_week', invitesThisWeek)
}, 1000 * 10)

process.on('unhandledRejection', (error) => {
  sendInfo({
    summary: 'An unhandled rejection was captured just now',
    detailed: error?.stack,
  })
  console.error(error)
})

module.exports = { app }
