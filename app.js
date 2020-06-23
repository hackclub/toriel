const { App, ExpressReceiver } = require("@slack/bolt")
const AirtablePlus = require('airtable-plus')
const express = require('express')

const { hasPushedButton, hasCompletedTutorial, getIslandId,
  sendEphemeralMessage, updateInteractiveMessage, sendSingleBlockMessage,
  startTutorial, isBot, setFlow, getUserRecord, updateSingleBlockMessage, sendMessage } = require('./utils/utils')

const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET })

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Load all files in the "/flows" folder
const normalizedPath = require("path").join(__dirname, "flows");
require("fs").readdirSync(normalizedPath).forEach(function (file) {
  require("./flows/" + file).loadFlow(app);
});

app.event('team_join', async body => {
  await startTutorial(app, body.event.user.id, 'default')
  // const bot = await isBot(app, body.event.user.id)
  // if (bot) {
  //   return
  // }

  // let userProfile = await app.client.users.info({
  //   token: process.env.SLACK_BOT_TOKEN,
  //   user: body.event.user.id
  // })

  // console.log(userProfile)

  // const somOptions = {
  //   maxRecords: 1,
  //   filterByFormula: `Email = '${userProfile.user.profile.email}'`
  // }

  // let somData = await axios(`https://api2.hackclub.com/v0.1/Pre-register/Applications?authKey=${process.env.AIRTABLE_API_KEY}&select=${JSON.stringify(somOptions)}&meta=true`).then(r => r.data)

  // console.log(somData)

  // if (somData.response[0] == null) {
  //   await startTutorial(app, body.event.user.id, 'default')
  // } else {
  //   await startTutorial(app, body.event.user.id, 'som')
  // }
});

app.command('/restart', async ({ command, ack }) => {
  await ack()
  if (command.text === '') {
    await setFlow(command.user_id, 'Default')
    await startTutorial(app, command.user_id, 'default', true)
  } else if (command.text === 'som') {
    await setFlow(command.user_id, 'Summer of Making')
    await startTutorial(app, command.user_id, 'som', true)
  }
})

app.event('message', async body => {
  if (body.message.subtype === 'channel_join' &&
    body.message.text === `<@${body.message.user}> has joined the channel`) {
    await app.client.chat.delete({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: body.message.channel,
      ts: body.message.event_ts
    })
  }
})

app.action('mimmiggie', async ({ ack, body }) => {
  ack();
});

// botInstance.action('leave_channel', replyWith() )
app.action('leave_channel', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(app, body.message.ts, body.channel.id, `(Btw, if you want to leave + archive this channel, click here)`)
  await sendSingleBlockMessage(app, body.channel.id, `Are you sure? You won't be able to come back to this channel.`, `Yes, I'm sure`, 'leave_confirm', 10)
});
app.action('leave_confirm', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(app, body.message.ts, body.channel.id, `Okay! Bye :wave:`)

  await app.client.conversations.archive({
    token: process.env.SLACK_OAUTH_TOKEN,
    channel: body.channel.id
  })
});

// Orpheus POSTS to this endpoint with the user ID of the promoted user and the ID of the promoter
// args: promotedId, promoterId
receiver.app.use(express.json())
receiver.app.post('/promote', async (req, res) => {
  console.log('received', req, req.query, req.body)
  const userId = req.body.promotedId
  const promoterId = req.body.promoterId
  const userRecord = await getUserRecord(userId)
  const islandId = userRecord.fields['Island Channel ID']

  sendSingleBlockMessage(app, islandId, `<@${userId}> :wave: Hey there! You've just been promoted to a full user by <@${promoterId}>. That means you have access to all of Hack Club's hundreds of channels instead of only the 4 you were added to.\n\nTo unlock the Hack Club community, click the :star2: below!`, ':star2:', 'promoted')
  res.status(200).end()
});

app.action('promoted', async ({ ack, body }) => {
  ack()
  await updateInteractiveMessage(app, body.message.ts, body.channel.ts, `:star2:`)
  await sendMessage(app, body.channel.id, `Woohoo! Welcome to Hack Club! :yay::orpheus::snootslide:`, 1000)

  await inviteUserToChannel(app, body.user.id, 'C0C78SG9L') //hq
  await inviteUserToChannel(app, body.user.id, 'C0266FRGV') //lounge
  await inviteUserToChannel(app, body.user.id, 'C0M8PUPU6') //ship
  await inviteUserToChannel(app, body.user.id, 'C0EA9S0A0') //code

  const inviteMessage = await sendMessage(app, body.channel.id, `I just invited you to the community's default channels. But click on this message to see a bunch of other cool channels you can join!`)

  await sendMessage(app,
    body.channel.id,
    `<#C013AGZKYCS> – Get to know the community by answering a question every day!
    <#C0NP503L7> - Upcoming events
    <#C6LHL48G2> - Game Development
    <#C0DCUUH7E> - Share your favorite music!
    <#CA3UH038Q> - Talk to others in the community!
    <#C90686D0T> - Talk about the LGBTQ community!
    <#CCW6Q86UF> - :appleinc:
    <#C1C3K2RQV> - Learn about design!
    <#CCW8U2LBC> - :google:
    <#CDLBHGUQN> - Photos of cats!
    <#CDJV1CXC2> - Photos of dogs!
    <#C14D3AQTT> - A public log of Hack Club's sent packages!
    <#CBX54ACPJ> - Share your photos!
    <#CC78UKWAC> - :jenga_sleep:
    <#C8P6DHA3W> - Don't enter if you're hungry!
    <#C010SJJH1PT> - Learn about cooking!
    <#CDJMS683D> - Count to a million, one at a time.
    <#CDN99BE9L> - Talk about Movies & TV!`,
    10,
    inviteMessage.message.ts
  )
});

(async () => {
  const port = process.env.PORT || 3000;

  await app.start(port);

  console.log(`⚡️ Bolt app is running on port ${port}!`);
})();
