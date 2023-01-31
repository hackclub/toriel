// the user joins #the-cave, the starter channel
const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')
const { prisma } = require('../db')
const { getEmailFromUser } = require('../util/get-invite')

module.exports = async function startFromClippy(req, res) {
  const {  user_id } = req.query
  await Promise.all([
    client.chat.postEphemeral({
      text: transcript('announcements-to-cave'),
      channel: transcript('channels.announcements'),
      user: user_id
    }),
  ])
  res.json({ pong: true })
}
