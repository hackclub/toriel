// the user joins #the-cave, the starter channel
const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')
const { prisma } = require('../db')
const { getEmailFromUser } = require('../util/get-invite')
const { metrics } = require('../util/metrics')

async function joinCaveInteraction(args) {
  const { client, payload } = args
  const { user } = payload

  try {
    await prisma.user.create({ data: { user_id: user } })
  } catch (e) {
    if (e.code !== 'P2002') throw e
  }

  await prisma.invite.updateMany({
    where: { email: await getEmailFromUser({ user }) },
    data: { user_id: user },
  })

  await prisma.user.update({
    where: {
      user_id: user,
    },
    data: {
      toriel_stage: 'STARTED_FLOW',
    },
  })

  metrics.increment('events.flow.cavestart', 1)

  await Promise.all([
    client.chat.postEphemeral({
      text: transcript('cave-join', { user }),
      channel: transcript('channels.super-duper-shubham-toriel-testing'),
      user,
    }),
  ])

  await Promise.all([
    await sleep(1000),
    await client.chat.postMessage({
      text: transcript('house.coc'),
      blocks: [
        transcript('block.text', {
          text: transcript('house.coc'),
        }),
        transcript('block.single-button', {
          text: 'i do',
          value: 'coc_complete',
        }),
      ],
      // icon_url: transcript('avatar.default'),
      channel: user,
      unfurl_links: false,
    }),
  ])
}
module.exports = { joinCaveInteraction }
