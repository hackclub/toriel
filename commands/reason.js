const { prisma } = require('../db')
const { transcript } = require('../util/transcript')

async function reason(args) {
  const { payload, respond } = args
  const { text, channel } = payload
  // check that we're in the welcome committee channel
  if (channel != transcript('channels.welcome-committee')) {
    await respond({ text: transcript('command.reason.wrong-channel') })
    return
  }

  if (!text) {
    await respond({ text: transcript('command.reason.no-reason') })
    return
  }

  const userRegex = /<@([A-Za-z0-9]+)\|.+>/i
  const userMatches = text.match(userRegex)
  const foundUser = userMatches ? userMatches[1] : null
  if (!foundUser || foundUser == '') {
    await respond({ text: transcript('command.reason.no-user') })
  }

  const invite = await prisma.invite.findFirst({
    where: { user_id: foundUser },
  })
  const reason = invite?.welcome_message

  await respond({ text: transcript('command.reason.success', { reason }) })
}

module.exports = reason
