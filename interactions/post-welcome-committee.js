const { prisma } = require('../db')
const { transcript } = require('../util/transcript')
const { client } = require('../app')

async function postWelcomeCommittee(user) {
  try {
    const slackuser = await client.users.info({ user })
    const email = slackuser?.user?.profile?.email
    const invite = await prisma.invite.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    })
    const message =
      invite?.['welcome_message'] || "I'm using the /toriel-restart command"
    const continent = invite?.['continent'] || 'DEFAULT_CONTINENT'
    const hs = invite ? invite.high_school : true
    const event = invite ? invite.event : null

    // This will go away once professor bloom is fully done
    await client.chat.postMessage({
      channel: transcript('channels.welcome-committee'),
      text: transcript('welcome-committee', {
        user,
        message,
        continent,
        hs,
        event,
      }),
    })

    // Can we add some error handling here so if the post request fails it dms me (@Jasper)?
    await fetch(`https://professorbloom.hackclub.com/toriel/newUser`, {
      headers: {
        'Content-Type': 'application/json',
        Auth: process.env.AUTH_TOKEN,
      },
      method: 'POST',
      body: JSON.stringify({
        user: user,
        continent: continent,
        joinReason: message,
      }),
    })
  } catch (e) {
    console.error(e)
  }
}

module.exports = { postWelcomeCommittee }
