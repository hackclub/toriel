// for testing: send me an email and I'll invite them to slack with all the right settings

const fetch = require('node-fetch')
const { transcript } = require('./transcript')

async function inviteUser(email) {
  const channels = [transcript('channels.cave')]
  const customMessage =
    'While wandering through a forest, you stumble upon a cave...'

  // @msw this is an undocumented Slack endpoint, not to be confused with
  // https://api.slack.com/methods/admin.users.invite. The SLACK_LEGACY_TOKEN is
  // a `xoxp` deprecated legacy token, which can no longer be generated:
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
  await fetch(url, { method: 'POST' })
    .then((r) => r.json())
    .then((r) => console.log('Slack response', r))
}

module.exports = { inviteUser }
