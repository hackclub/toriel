// the user joins #the-cave, the starter channel
const { inviteUserToChannel } = require('../util/invite-user-to-channel')
const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')

async function joinCaveInteraction(args) {
  const { client, payload } = args
  const { user, channel } = payload
  await client.chat.postEphemeral({
    text: transcript('cave-join', { user }),
    channel: transcript('channels.cave'),
    user,
  })

  await sleep(1000)

  await client.chat.postMessage({
    text: transcript('house.hello'),
    // icon_url: transcript('avatar.default'),
    channel: user,
  })

  await sleep(1000)

  await client.chat.postMessage({
    text: transcript('house.venture'),
    // icon_url: transcript('avatar.sad'),
    channel: user,
  })
  await client.chat.postMessage({
    text: transcript('house.beforeGo'),
    // icon_url: transcript('avatar.default'),
    channel: user,
  })

  await inviteUserToChannel(
    client,
    user,
    transcript('channels.slack-themes'),
    true
  )
  await sleep(1000)

  await client.chat.postMessage({
    text: transcript('house.theme'),
    // icon_url: transcript('avatar.default'),
    channel: user,
  })

  await client.chat.postMessage({
    blocks: [
      transcript('block.single-button', {
        text: 'Continue',
        value: 'theme_complete',
      }),
    ],
    // icon_url: transcript('avatar.log'),
    channel: user,
  })

  // await client.chat.postMessage({
  //   text: transcript('house.basement'),
  //   blocks: [
  //     {
  //       type: 'context',
  //       elements: [
  //         {
  //           type: 'mrkdwn',
  //           text: transcript('house.basement'),
  //         },
  //       ],
  //     },
  //   ],
  //   // icon_url: transcript('avatar.sad'),
  //   channel: user,
  // })
}
module.exports = { joinCaveInteraction }
