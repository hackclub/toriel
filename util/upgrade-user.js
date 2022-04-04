const FormData = require('form-data')
const fetch = require('node-fetch')

async function upgradeUser(client, user) {
  const userProfile = await client.users.info({ user })
  const { team_id } = userProfile.user

  if (
    !userProfile.user.is_restricted &&
    !userProfile.user.is_ultra_restricted
  ) {
    console.log(`User ${user} is already a full user– skipping`)
    return null
  }

  // @msw This endpoint is undocumented. It's usage and token were taken from
  // inspecting the network traffic while upgrading a user. The
  // SLACK_INVITE_TOKEN is a `xoxs` token that can be found in browsers.
  // Don't confuse this with https://api.slack.com/methods/admin.users.setRegular.
  const form = new FormData()
  form.append('user', user)
  form.append('token', process.env.SLACK_INVITE_TOKEN)
  return await fetch(
    `https://slack.com/api/users.admin.setRegular?slack_route=${team_id}`,
    {
      method: 'POST',
      body: form,
    }
  )
    .then(resolve)
    .catch(reject)
}

module.exports = { upgradeUser }
