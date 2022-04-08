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
      const { ok, error } = await inviteUser(req.body)
      result.ok = ok
      result.error = error
    }
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(500).json({ ok: false, error: 'a fatal error occurred' })
  }
}
