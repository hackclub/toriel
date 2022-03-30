// the user joins #the-cave, the starter channel
const { inviteUserToChannel } = require('../util/invite-user-to-channel')
const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')

async function joinCaveInteraction(args) {
  const { client, payload } = args
  const { user, channel } = payload

  await Promise.all([
    client.chat.postMessage({
      channel: user,
      blocks: [
        {
          type: 'divider',
        },
      ],
    }),
    client.chat.postEphemeral({
      text: transcript('cave-join', { user }),
      channel: transcript('channels.cave'),
      user,
    }),
  ])

  await Promise.all([
    await sleep(1000),
    await client.chat.postMessage({
      text: transcript('house.hello'),
      // icon_url: transcript('avatar.default'),
      channel: user,
    }),
  ])

  await sleep(3000)

  await client.chat.postMessage({
    text: transcript('house.venture'),
    // icon_url: transcript('avatar.sad'),
    channel: user,
  })

  await Promise.all([
    sleep(3000),
    client.chat.postMessage({
      text: transcript('house.beforeGo'),
      // icon_url: transcript('avatar.default'),
      channel: user,
    }),
  ])

  await Promise.all([
    client.chat.postMessage({
      text: transcript('house.theme'),
      // icon_url: transcript('avatar.default'),
      channel: user,
    }),
    inviteUserToChannel(
      client,
      user,
      transcript('channels.slack-themes'),
      true
    ),
  ])

  await Promise.all([
    sleep(3000),
    client.chat.postMessage({
      text: transcript('house.theme-invite'),
      channel: user,
    }),
  ])

  await client.chat.postMessage({
    text: "I'm done with colors",
    blocks: [
      transcript('block.single-button', {
        text: "I'm done with colors",
        value: 'theme_complete',
      }),
    ],
    // icon_url: transcript('avatar.log'),
    channel: user,
  })
}
module.exports = { joinCaveInteraction }
