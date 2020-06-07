const { App } = require("@slack/bolt")
const AirtablePlus = require('airtable-plus')

const { hasPushedButton, hasCompletedTutorial, getIslandId, sendEphemeralMessage } = require('./utils')

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

// Load all files in the "/flows" folder
const normalizedPath = require("path").join(__dirname, "flows");
require("fs").readdirSync(normalizedPath).forEach(function (file) {
  require("./flows/" + file).loadFlow(app);
});

app.event('member_joined_channel', async body => {
  const pushedFirstButton = await hasPushedButton(body.event.user)
  const completed = await hasCompletedTutorial(body.event.user)
  const islandId = await getIslandId(body.event.user)

  if (body.event.channel !== 'C75M7C0SY' && body.event.channel !== 'C0M8PUPU6' && body.event.channel !== 'C013AGZKYCS' && body.event.channel !== islandId && !completed) {
    const members = await app.client.conversations.members({
      token: process.env.SLACK_BOT_TOKEN,
      channel: body.event.channel
    })
    if (!(members.members.includes('U012FPRJEVB'))) { // user who owns the oauth, in this case @Clippy Admin
      await app.client.conversations.join({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: body.event.channel
      })
    }
    await app.client.conversations.kick({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: body.event.channel,
      user: body.event.user
    })
    let islandId = await getIslandId(body.event.user)
    await sendEphemeralMessage(islandId, `<@${body.event.user}> It looks like you tried to join <#${body.event.channel}>. You can't join any channels yet—I need to finish helping you join the community first.`, body.event.user)
    await app.client.chat.postMessage({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: 'U4QAK9SRW',
      text: `Heads up, I kicked <@${body.event.user}> from <#${body.event.channel}>`
    })
  }
});

(async () => {
  await app.start(process.env.PORT || 3000)
  console.log("⚡️ Bolt app is running!")
})();
