require('dotenv').config()
const { inviteUserToChannel } = require('./util/invite-user-to-channel')
const { mirrorMessage } = require('./util/mirror-message')
const { transcript } = require('./util/transcript')
const { upgradeUser } = require('./util/upgrade-user')
const {
  postWelcomeCommittee,
} = require('./interactions/post-welcome-committee')
const express = require('express')

const { app, client } = require('./app.js')
const { receiver } = require('./express-receiver')
const { getInvite } = require('./util/get-invite')
const { sleep } = require('./util/sleep')
const { prisma } = require('./db')

receiver.router.use(express.json())

receiver.router.get('/', require('./endpoints/index'))

receiver.router.get('/ping', require('./endpoints/ping'))

receiver.router.get(
  '/slack-tutorial/:user',
  require('./endpoints/slack-tutorial')
)

receiver.router.post('/slack-invite', require('./endpoints/slack-invite'))

const defaultChannels = [
  'lounge',
  'scrapbook',
  'ship',
  'hq',
  'neighbourhood',
  '8-ball',
  'code',
  'confessions',
  'counttoamillion',
  'hack-night',
  'question-of-the-day',
]
const apacChannels = [
  'apac-lounge',
  'apac-hq',
  'apac-community',
  'apac-hack-night',
]

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
  ]
  return suggestions[Math.floor(Math.random() * suggestions.length)]
}

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

  const protectedChannels = [transcript('channels.cave')]
  if (type == 'message' && protectedChannels.includes(channel)) {
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

  defaultAdds = defaultChannels.concat(apacChannels) // add all default channels into new array

  defaultAddsId = defaultAdds.map((e) => {
    return transcript(`channels.${e}`)
  }) // map all default channels into ids as channel prop is given as id

  if (
    subtype === 'channel_join' &&
    text === `<@${user}> has joined the channel` &&
    defaultAddsId.includes(channel)
  ) {
    console.log('Deleting "user has joined" message')
    await client.chat
      .delete({
        token: process.env.SLACK_LEGACY_TOKEN, // sudo
        channel,
        ts,
      })
      .catch((e) => {
        console.warn(e)
      })
  } // delete "user has joined" message if it is sent in one of the default channels that TORIEL adds new members to
})

const addToChannels = async (user, epoch) => {
  await upgradeUser(user)

  await sleep(1000) // timeout to prevent race-condition during channel invites
  const invite = await getInvite({ user })
  let channelsToInvite = defaultChannels
  if (epoch) {
    channelsToInvite.push('epoch')
  }
  await Promise.all([
    Promise.all(
      channelsToInvite.map((c) =>
        inviteUserToChannel(user, transcript(`channels.${c}`))
      )
    ),
    postWelcomeCommittee(user),
  ])

  const suggestion = getSuggestion()
  await client.chat.postMessage({
    text: transcript(
      epoch ? 'house.added-to-channels' : 'house.added-to-channels-epoch',
      { suggestion }
    ),
    blocks: [
      transcript('block.text', {
        text: transcript(
          !epoch ? 'house.added-to-channels' : 'house.added-to-channels-epoch',
          { suggestion }
        ),
      }),
      transcript('block.single-button', {
        text: !epoch ? 'reroll' : `I've introduced myself...`,
        value: 'reroll',
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
    case 'coc_complete':
      await client.chat.postMessage({
        text: transcript('house.profile'),
        blocks: [
          transcript('block.text', { text: transcript('house.profile') }),
          transcript('block.image', {
            url: transcript('house.profile-image'),
            altText: transcript('house.profile-alt-text'),
          }),
          transcript('block.single-button', {
            text: "i've filled out my profile",
            value: 'profile_complete',
          }),
        ],
        channel: user,
      })
      break
    case 'profile_complete':
      const slackuser = await client.users.info({ user })
      const email = slackuser?.user?.profile?.email
      const invite = await prisma.invite.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      })
      if (invite.welcome_message == "I'm going to Epoch!") {
        await prisma.user.update({
          where: { user_id: user },
          data: { club_leader: false },
        })
        await addToChannels(user, true)
        break
      } else {
        await client.chat.postMessage({
          text: transcript('house.checkClubLeader'),
          blocks: [
            transcript('block.text', { text: transcript('house.club-leader') }),
            transcript('block.double-button', [
              { text: 'yes', value: 'club_leader_yes' },
              { text: 'no', value: 'club_leader_no' },
            ]),
          ],
          channel: user,
        })
      }
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
      break
    case 'club_leader_no':
      await prisma.user.update({
        where: { user_id: user },
        data: { club_leader: false },
      })
      await addToChannels(user)
      break
    case 'reroll':
      const suggestion = getSuggestion()
      await respond({
        replace_original: true,
        text: transcript('house.added-to-channels', { suggestion }),
        blocks: [
          transcript('block.text', {
            text: transcript('house.added-to-channels', { suggestion }),
          }),
          transcript('block.single-button', {
            text: 'reroll',
            value: 'reroll',
          }),
        ],
        unfurl_links: false,
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
