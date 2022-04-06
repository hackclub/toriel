const { prisma } = require("../db")
const { transcript } = require("../util/transcript")

async function postWelcomeCommittee(client, user) {
  const slackuser = await client.users.info
  const email = slackuser?.user?.profile?.email
  const invite = await prisma.invite.findUnique({ where: {email} })
  client.chat.postMessage({
    channel: transcript('channels.welcome-committee'),
    text: transcript('welcome-committee', {
      user,
      message: invite['welcome_message'],
      continent: invite['continent'],
      hs: invite['high_school'],
    })
  })
}

module.exports = { postWelcomeCommittee }