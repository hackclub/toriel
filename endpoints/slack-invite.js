const { client } = require('../app')
const { inviteUser } = require('../util/invite-user')
const { transcript } = require('../util/transcript')

module.exports = async function slackInvite(req, res) {
  // this endpoint is hit by the form on hackclub.com/slack
  try {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' })
    }
    if (req.headers.authorization != `Bearer ${process.env.AUTH_TOKEN}`) {
      return res.status(403).json({ error: 'Invalid credentials sent!' })
    }

    const email = req?.body?.email
    const result = { email }
    if (email) {
      const res = await inviteUser(req.body)
      result.ok = res.ok
      result.error = res.error
      let invites = res?.invites
      if (invites) {
        result.error = invites[0]?.error
        result.ok = result.ok
      }
      if (result.error === 'already_in_team') {
        // User is already in Slack - send them an email via Loops telling them how to login
        let email = res?.invites[0]?.email
        let userInfo = await client.users.lookupByEmail({ email })
        let isMcg = userInfo?.user?.is_restricted
        let isScg = userInfo?.user?.is_ultra_restricted
        let dataVariables
        let transactionalId
        if (isMcg) {
          // Check if they're in cave channel, invite if not
          await client.conversations
            .invite({
              channel: transcript('channels.cave'),
              users: userInfo.user.id,
              token: process.env.SLACK_USER_TOKEN,
            })
            .catch((err) => {
              if (err.data.error === 'already_in_channel') {
                // User is already in channel, do nothing
              } else {
                console.log(err)
              }
            })
          let caveChannelData = await client.conversations.info({
            channel: transcript('channels.cave'),
          })
          let caveChannelName = caveChannelData.channel.name

          dataVariables = {
            email,
            caveChannelName: caveChannelName,
            caveChannelUrl: `https://hackclub.slack.com/archives/${transcript('channels.cave')}`,
          }
          transactionalId = process.env.LOOPS_MCG_TRANSACTIONAL_ID
        } else if (isScg) {
          // We shouldn't really have any of these and if we do, we likely don't want to promote them
          return res.status(500).json({ ok: false, error: 'User is already in Slack but is an SCG' })
        } else {
          // Full user, don't invite to chanel - just set the full user template
          dataVariables = {
            email,
          }
          transactionalId = process.env.LOOPS_FULL_USER_TRANSACTIONAL_ID
        }

        const lres = await fetch('https://app.loops.so/api/v1/transactional', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
          },
          body: JSON.stringify({
            email,
            transactionalId,
            dataVariables,
          }),
        })
      }
    }
    return res.json(result)
  } catch (e) {
    console.log(e)
    return res.status(500).json({ ok: false, error: 'a fatal error occurred' })
  }
}
