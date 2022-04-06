const { prisma } = require('../db')
const { transcript } = require('../util/transcript')

async function postWelcomeCommittee(client, user) {
  try {
    const slackuser = await client.users.info({ user })
    const email = slackuser?.user?.profile?.email
    const invite = await prisma.invite.findFirst({ where: { email }, orderBy: { createdAt: "desc"} })
    await client.chat.postMessage({
      channel: transcript('channels.welcome-committee'),
      text: transcript('welcome-committee', {
        user,
        message: invite['welcome_message'],
        continent: invite['continent'],
        hs: invite['high_school'],
      }),
    })
  } catch (e) {
    console.log(e)
  }
}

module.exports = { postWelcomeCommittee }
