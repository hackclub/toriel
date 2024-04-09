const { App } = require('@slack/bolt')
const { receiver } = require('./express-receiver')

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
})

module.exports = { app, client: app.client }
