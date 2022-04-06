// the user joins #the-basement

const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')

async function joinBasement(args) {
  const { client, payload } = args
  const { user, channel } = payload
  await client.chat.postEphemeral({
    text: transcript('basement-join'),
    icon_url: transcript('avatar.sad'),
    user,
    channel,
  })
  await sleep(1000)
  await client.chat.postEphemeral({
    text: transcript('basement-join-2'),
    icon_url: transcript('avatar.default'),
    user,
    channel,
    username: 'TORIAL',
  })
  await sleep(1000)
  await client.chat.postEphemeral({
    text: transcript('basement-join-3'),
    icon_url: transcript('avatar.happy'),
    user,
    channel,
  })
  // await client.chat.postEphemeral({
  //   text: transcript('basement-join', { user }),
  //   blocks: [
  //     {
  //       type: 'section',
  //       text: {
  //         type: 'plain_text',
  //         text: transcript('basement-join', { user }),
  //       },
  //     },
  //     transcript('room-button-blocks'),
  //   ],
  //   channel: transcript('channels.the-basement'),
  //   user,
  //   icon_url: transcript('avatar.sad'),
  // })
}
module.exports = { joinBasementInteraction: joinBasement }
