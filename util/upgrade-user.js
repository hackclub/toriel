const { transcript } = require('./transcript')

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
  await client.users.admin.setRegular({
    team_id,
    user_id: user,
    token: process.env.SLACK_LEGACY_TOKEN,
  })
}

module.exports = { upgradeUser }
