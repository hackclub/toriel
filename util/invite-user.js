const fetch = require('node-fetch')
const { prisma } = require('../db')
const { transcript } = require('./transcript')

async function inviteUser({ email, ip, continent, teen, reason, userAgent }) {
  await prisma.invite.create({
    data: {
      email: email,
      user_agent: userAgent || 'user_agent is empty',
      ip_address: ip,
      high_school: teen, // we actually just care if they're a teenager, so middle school is included in high school
      welcome_message: reason, // record their reason for joining the slack as their welcome message
      continent: continent.toUpperCase().replace(/\W/g, '_'),
    },
  })

  const channels = [transcript('channels.cave-a')]
  const customMessage =
    'While wandering through a forest, you stumble upon a cave...'

  // This is a private api method found in https://github.com/ErikKalkoken/slackApiDoc/blob/master/users.admin.invite.md
  // I only got a successful response by putting all the args in URL params
  // Giving JSON body DID NOT WORK when testing locally
  // —@MaxWofford

  // The SLACK_LEGACY_TOKEN is a `xoxp` deprecated legacy token, which can no
  // longer be generated:
  // https://api.slack.com/legacy/custom-integrations/legacy-tokens

  const params = [
    `email=${email}`,
    `token=${process.env.SLACK_LEGACY_TOKEN}`,
    // `real_name=${data.name}`,
    'restricted=true',
    `channels=${channels.join(',')}`,
    `custom_message=${customMessage}`,
    'resend=true',
  ].join('&')
  const url = `https://slack.com/api/users.admin.invite?${params}`
  const slackResponse = await fetch(url, { method: 'POST' }).then((r) =>
    r.json()
  )
  return slackResponse
}

module.exports = { inviteUser }
