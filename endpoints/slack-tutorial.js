const { client } = require('../app')
const { prisma } = require('../db')

module.exports = async function slackTutorial(req, res) {
  // this endpoint is hit by @clippy in the Slack to check if @toriel is handling the onboarding
  // if we return false, @clippy will step in and onboard the user
  const { user } = req.params
  const slackuser = await client.users.info({ user })
  const email = slackuser?.user?.profile?.email
  const invite = await prisma.invite.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    invite: Boolean(invite),
  })
}
