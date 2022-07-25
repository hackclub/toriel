// the user joins #the-cave, the starter channel
const { inviteUserToChannel } = require('../util/invite-user-to-channel')
const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')

async function joinCaveInteraction(args) {
  const { client, payload } = args
  const { user, channel } = payload

  await Promise.all([
    client.chat.postEphemeral({
      text: transcript('cave-join', { user }),
      channel: transcript('channels.cave'),
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
          text: 'i agree',
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
