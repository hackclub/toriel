const { ExpressReceiver } = require('@slack/bolt')

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

module.exports = { receiver }
