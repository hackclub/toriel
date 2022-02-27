require('dotenv').config()
const { App, ExpressReceiver } = require("@slack/bolt")
const AirtablePlus = require('airtable-plus')
const express = require('express')
const fetch = require('node-fetch')
const axios = require('axios')
const { bugsnag } = require('./utils/bugsnag')

bugsnag()

const { hasPushedButton, hasCompletedTutorial, getIslandId,
  sendEphemeralMessage, updateInteractiveMessage, sendSingleBlockMessage,
  startTutorial, isBot, setFlow, getUserRecord, inviteUserToChannel, sendMessage, updateSingleBlockMessage,
  getPronouns, getWhereFrom,
  sendToWelcomeCommittee } = require('./utils/utils')

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

async function restart({ command, ack }) {
  await ack()
  if (command.text === '') {
    await setFlow(command.user_id, 'Default')
    await startTutorial(app, command.user_id, 'default', true, false)
  } else if (command.text === 'som') {
    await setFlow(command.user_id, 'Summer of Making')
    await startTutorial(app, command.user_id, 'som', true, false)
  }
}

app.command('/dev-restart', restart) // for dev app
app.command('/restart', restart) // for production app

app.command('/clippy-channel', async ({ command, ack, respond }) => {
  await ack()
  if (command.text === '') {
    await respond({
      text: `Usage: \`/clippy-channel @username\``,
      response_type: 'ephemeral'
    })
  } else {
    const userId = command.text.split(' ')[0].split('|')[0].substring(2)
    console.log('user id', userId)
    const userRecord = await getUserRecord(userId)
    try{
      await respond({
        text: `<@${userId}>'s Clippy channel is \`${userRecord.fields['Island Channel Name']}\`. \`https://app.slack.com/client/T0266FRGM/${userRecord.fields['Island Channel ID']}\``,
        response_type: 'ephemeral'
      })
    }
    catch{
      await respond({
        text: `I don't know, sorry mate.`,
        response_type: 'ephemeral'
      })
    }
  }
})

app.event('message', async body => {
const defaultAdds = ['C0C78SG9L', 'C0EA9S0A0', 'C0266FRGV', 'C0M8PUPU6', 'C75M7C0SY', 'C01504DCLVD', 'C01D7AHKMPF']
  
  if ((body.message.subtype === 'channel_join' && body.message.text === `<@${body.message.user}> has joined the channel` && defaultAdds.includes(body.message.channel))
      || (body.message.channel === 'C01A6SCS14M' && body.message.user !== 'U012H797734')) {
    try{
      await app.client.chat.delete({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: body.message.channel,
        ts: body.message.event_ts
      })
    }
    catch{
      console.log("deleting things is broken!!")
    }
  }
})

app.event('member_joined_channel', async (body) => {
  if (body.event.channel === 'C01A6SCS14M') {
    await app.client.conversations.kick({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: body.event.channel,
      user: body.event.user
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
  try{
    if (req.body.key != process.env.ORPHEUS_KEY) return res.status(403).send('Only Orpheus can make this request!')
    const userId = req.body.promotedId
    const promoterId = req.body.promoterId
    const userRecord = await getUserRecord(userId)
    const islandId = userRecord.fields['Island Channel ID']

    sendSingleBlockMessage(app, islandId, `<@${userId}> :wave: Hey there! You've just been promoted to a full user by <@${promoterId}>. That means you have access to all of Hack Club's hundreds of channels instead of only the 4 you were added to.\n\nTo unlock the Hack Club community, click the :star2: below!`, ':star2:', 'promoted')
    res.status(200).end()
  }
  catch{
    console.log('failed!')
  }
});

app.action('promoted', async ({ ack, body }) => {
  ack()
  try{
    await updateInteractiveMessage(app, body.message.ts, body.channel.id, ':star2:')
  }
  catch (error){
    console.log("A fishy error I found: " + error)
  }
  await sendMessage(app, body.channel.id, `Woohoo! Welcome to Hack Club! :yay::orpheus::snootslide:`, 1000)
  const inviteMessage = await sendMessage(app, body.channel.id, `I just invited you to the community's default channels. But click on this message to see a bunch of other cool channels you can join!`)

  await inviteUserToChannel(app, body.user.id, 'C0C78SG9L') //hq
  await inviteUserToChannel(app, body.user.id, 'C0266FRGV') //lounge
  await inviteUserToChannel(app, body.user.id, 'C0M8PUPU6') //ship
  await inviteUserToChannel(app, body.user.id, 'C0EA9S0A0') //code
  await inviteUserToChannel(app, body.user.id, 'C0EA9S0A0') //streambot find right code for this

  // come up with 3 user profiles and decide what the best onboarding flow

  /*await sendMessage(app,
    body.channel.id,
    `<#C013AGZKYCS> – Get to know the community by answering a question every day!
<#C0NP503L7> - Upcoming events
<#C6LHL48G2> - Game development
<#C0DCUUH7E> - Share your favorite songs & discover new music
<#CA3UH038Q> - Talk to others in the community!
<#C90686D0T> - Talk about LGBTQ+ things!
<#CCW6Q86UF> - :appleinc:
<#C1C3K2RQV> - Learn about design!
<#CCW8U2LBC> - :google:
<#CDLBHGUQN> - Photos of cats!
<#CDJV1CXC2> - Photos of dogs!
<#C14D3AQTT> - A public log of Hack Club's sent packages
<#CBX54ACPJ> - Share your photos!
<#CC78UKWAC> - :jenga_sleep:
<#C8P6DHA3W> - Don't enter if you're hungry!
<#C010SJJH1PT> - Learn about cooking!
<#CDJMS683D> - Count to a million, one at a time.
<#CDN99BE9L> - Talk about Movies & TV!`,
    10,
    inviteMessage.message.ts
  )*/

  const userRecord = await getUserRecord(body.user.id)
  const reasonJoined = userRecord.fields['What brings them?']
  sendToWelcomeCommittee(app, body.user.id, reasonJoined, true)

  const pronouns = await getPronouns(body.user.id)
  if (pronouns.pronouns === "they/them/theirs" || pronouns.pronouns === "she/her/hers") {
    await sendMessage(app, body.channel.id, `By the way, I also recommend checking out <#CFZMXJ3FB>—it’s a channel for women/femme/non-binary people in Hack Club! :orpheus::sparkling_heart:`)
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Bolt app is running on port ${port}!`);

  let latestCommitMsg = '¯\\_(ツ)_/¯'
  await fetch('https://api.github.com/repos/hackclub/clippy/commits/main')
    .then((r) => r.json())
    .then((d) => (latestCommitMsg = d.commit.message))

  const message = `It looks like I'm alive again! Here's what I'm up to now: *${latestCommitMsg}*`
  await sendMessage(app, 'C0P5NE354', message, 10)
})();
