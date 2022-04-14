const { client } = require('../app')
const { prisma } = require('../db')

async function getEmailFromUser({ user }) {
  const slackUser = await client.users.info({ user })
  const email = slackUser?.user?.profile?.email
  return email
}

async function getInvite({ user, email }) {
  if (!email) {
    email = await getEmailFromUser({ user })
  }
  const invite = await prisma.invite.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  return invite
}

module.exports = { getInvite }
