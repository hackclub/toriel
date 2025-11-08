const { client } = require('../app')
const { metrics } = require('./metrics')
const { sendUrgent } = require('./alert')
async function upgradeUser(user) {
  const userProfile = await client.users.info({ user })
  const { team_id } = userProfile.user

  if (
    !userProfile.user.is_restricted &&
    !userProfile.user.is_ultra_restricted
  ) {
    console.log(`User ${user} is already a full user– skipping`)
    return null
  }
  const startPerf = Date.now()
  console.log(`Attempting to upgrade user ${user}`)

  // @msw: This endpoint is undocumented. It's usage and token were taken from
  // inspecting the network traffic while upgrading a user. It's the result of
  // trial and error replicating the browser calls Slack's admin dashboard
  // makes, so duplicate fields (ie. putting user in the URL and JSON body) were
  // found necessary get a 200 OK from Slack.

  // The SLACK_COOKIE is a xoxd-* token found in browser cookies under the key 'd'
  // The SLACK_BROWSER_TOKEN is a xoxc-* token found in browser local storage using this script: https://gist.github.com/maxwofford/5779ea072a5485ae3b324f03bc5738e1

  // const cookieValue = `d=${process.env.SLACK_COOKIE}`

  // // Create a new Headers object
  // const headers = new Headers()

  // Add the cookie to the headers
  // headers.append('Cookie', cookieValue)
  // headers.append('Content-Type', 'application/json')
  // headers.append('Authorization', `Bearer ${process.env.SLACK_BROWSER_TOKEN}`)

  // const form = JSON.stringify({
  //   user,
  //   team_id,
  // })
  // return await fetch(
  //   `https://slack.com/api/users.admin.setRegular?slack_route=${team_id}&user=${user}`,
  //   {
  //     headers,
  //     method: 'POST',
  //     body: form,
  //   }
  // )
  
  const headers = new Headers()
  headers.append('Content-Type', 'application/json')
  headers.append('Authorization', `Bearer ${process.env.CHARON_API_KEY}`)
  
  const data = JSON.stringify({
    id: user
  })
  return await fetch("https://charon.hackclub.com/user/promote", {
    method: "POST",
    body: data,
  })
    .then((r) => {
      r.json()
      metrics.increment('events.flow.user_upgrade', 1)
    })
    .catch((e) => {
      sendUrgent({
        summary: `A user upgrade failed!`,
        detailed: `Upgrading <@${user}> from a multi channel user to a regular user has failed.`,
      })
      metrics.increment('events.flow.error.userUpgradeFailure', 1)
      console.error()
    })
    .finally((e) => {
      // send this value to client pls
      /*
      const time = Date.now() - startPerf
      client.timing('events.flow.user_upgrade.time', time)*/
    })
}

module.exports = { upgradeUser }
