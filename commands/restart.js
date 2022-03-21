const { joinInteraction } = require("../interactions/join")
const { transcript } = require("../util/transcript")

async function restart(args) {
  console.log('running here')
  const { payload, client } = args
  const { user_id } = payload

  console.log({
    payload,
    text: 'restarting...',
    channel: user_id,
    username: 'TUTORIEL',
    icon_url: transcript('startup.avatar')
  })
  await client.chat.postMessage({
    text: 'restarting...',
    channel: user_id,
    username: 'TUTORIEL',
    icon_url: transcript('startup.avatar')
  })

  const joinArgs = args
  joinArgs.payload.channel = transcript('channels.cave')
  joinArgs.payload.user = user_id
  joinInteraction(args)
}
module.exports = restart