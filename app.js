const { App } = require("@slack/bolt")
const AirtablePlus = require('airtable-plus')
const friendlyWords = require('friendly-words')
const GithubSlugger = require('github-slugger')
const slugger = new GithubSlugger()

const islandTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: 'appYGt7P3MtotTotg',
  tableName: 'Tutorial Island'
})

const eventsTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: 'appezi7TOQFt8vTfa',
  tableName: 'Events'
})

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

/* Add functionality here */

app.command('/restart', async ({ command, ack, say }) => {
  await ack();
  startTutorial(command.user_id, true)
});

app.event('team_join', async body => {
  await startTutorial(body.event.user.id)
});

app.action('intro_progress', async ({ ack, body }) => {
  ack();
  updateInteractiveMessage(body.message.ts, body.channel.id, `Hi, I'm Clippy! I'm the Hack Club assistant and my job is to get you on the Slack. Do you need assistance?`)
  
  await sendMessage(body.channel.id, '...', 1000)
  await sendMessage(body.channel.id, '...', 1000)
  await sendMessage(body.channel.id, `I'll take that as a yes! I'm happy to assist you in joining Hack Club today.`, 1000)
  await sendMessage(body.channel.id, `Just a few quick questions to get you started.`)
  
  await timeout(3000)
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: body.channel.id,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Are you currently a high school student? (it's OK if you're not)`
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Yes"
            },
            "style": "primary",
            "action_id": "hs_yes"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "No"
            },
            "style": "danger",
            "action_id": "hs_no"
          }
        ]
      }
    ]
  })
});

app.action('hs_yes', async ({ ack, body }) => {
  ack();
  updateInteractiveMessage(body.message.ts, body.channel.id, 'Hack Club is a community of high schoolers, so you\'ll fit right in!')
  await sendMessage(body.channel.id, `What brings you to the Hack Club community?`)
});

app.action('hs_no', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, 'Just a heads-up: Hack Club is a community of high schoolers, not a community of professional developers. You will likely still find a home here if you are in college, but if you\'re older than that, you may find yourself lost here.')
  await sendSingleBlockMessage(body.channel.id, 'If you understand this and still want to continue on, click the 👍 below.', '👍', 'hs_acknowledge')
});

app.action('hs_acknowledge', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, '👍')
  await sendMessage(body.channel.id, `What brings you to the Hack Club community?`)
});

app.event('message', async body => {
  if (body.message.subtype === 'channel_join' &&
      body.message.text === `<@${body.message.user}> has joined the channel`) {
    await app.client.chat.delete({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: body.message.channel,
      ts: body.message.event_ts
    })
  }
  
  const correctChannel = await getIslandId(body.event.user)
  
  if (messageIsPartOfTutorial(body, correctChannel)) {
    const history = await app.client.conversations.history({
      token: process.env.SLACK_BOT_TOKEN,
      channel: body.event.channel
    })
    const botHistory = history.messages.filter(
      message => message.user === process.env.BOT_USER_ID
    )
    const lastBotMessage = botHistory[0].text
    const lastUserMessage = history.messages[0].text
    
    if (lastBotMessage.includes('What brings you')) {
      // send it to welcome-committee
      await sendMessage('GLFAEL1SL', 'New user <@' + body.event.user + '> joined! Here\'s why they joined the Hack Club community:\n\n' + lastUserMessage + '\n\nReact to this message to take ownership on reaching out.', 10)
      
      await sendMessage(body.event.channel, `Ah, very interesting! Well, let me show you around the community.`)
      await sendMessage(body.event.channel, `You're currently on Slack, the platform our community uses. If you're familiar with Discord, you'll find that Slack feels similar.`)
      await sendMessage(body.event.channel, `Slack is organized into "channels", and each channel includes discussion about its own topic. We have _hundreds_ of channels, covering everything from game development and web design to photography and cooking. I'll show you a few of my favorites in a minute.`, 5000)
      await sendMessage(body.event.channel, `I just invited you to your first channel, <#C75M7C0SY>. Join by clicking on it in your sidebar, and introduce yourself to the community.`, 5000)
      
      // add user to #welcome
      await inviteUserToChannel(body.event.user, 'C75M7C0SY')
      const island = await getIslandName(body.event.user)
      await sendEphemeralMessage('C75M7C0SY', `<@${body.event.user}> Feel free to introduce yourself to the community in <#C75M7C0SY>. When you're done, head back to <https://hackclub.slack.com/archives/${island}|#${island}> to continue your introduction to the community.`, body.event.user)
      
      await sendSingleBlockMessage(body.event.channel, "When you're ready, click the 👍 on this message to continue the tutorial.", '👍', 'introduced')
    }
  }
});

app.action('introduced', async ({ ack, body }) => {
  ack();
  updateInteractiveMessage(body.message.ts, body.channel.id, 'Awesome! Let\'s keep going.')
  
  const nextEvent = await getNextEvent()
  await sendMessage(body.channel.id, `There are awesome things happening in the Hack Club community every day! Check out <#C0266FRGT> to see the latest community event. We do everything from coding challenges to AMAs with famous people (e.g. Tom Preston-Werner) to fun hangouts, and more!`)
  //await sendMessage(body.channel.id, `The next community event is called *${nextEvent.name}*, and it's happening on ${nextEvent.day} at ${nextEvent.time} eastern time. You can <${nextEvent.url}|learn more about the event by clicking here>. We'd love to see you there!`, 5000)
  await sendMessage(body.channel.id, `Our favorite recurring community event is called <#C0JDWKJVA>. Hack Night is a biweekly call where we all get together and hang out, build things, and have fun! Hack Night happens on Saturdays at 8:30pm eastern and Wednesdays at 3:30pm eastern. We'd love to see you at the next one!`, 7000)
  await sendMessage(body.channel.id, `We also have a community-wide currency called gp! Type /market to see what you can do with it.`, 5000)
  await sendMessage(body.channel.id, `One last thing: please make sure to read our <${`https://hackclub.com/conduct`}|code of conduct>. All community members are expected to follow the code of conduct.`, 5000, null, true)
  await sendSingleBlockMessage(body.channel.id, `Once you've read the code of conduct, click the 👍 to continue with the tutorial.`, '👍', `coc_acknowledge`)
});

app.action('coc_acknowledge', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, '👍')
  //finishTutorial(body.channel.id, body.user.id)
  await sendMessage(body.channel.id, `That's all from me! I hope I've been able to help you get acquainted with the Hack Club community.`)
  const finalMessage = await sendMessage(body.channel.id, `I've added you to a few of the most popular channels, but there are many, many more! Click on "6 replies" to learn more about the channels you were just added to and discover some other cool channels...`, 5000)
  const finalTs = finalMessage.message.ts

  const hqDesc = `*<#C0C78SG9L>* is where people ask the community/@staff any questions about Hack Club.`
  const loungeDesc = `*<#C0266FRGV>* is where people go to hang out with the community. There are no expectations here; just have fun and hang out with the community :)`
  const shipDesc = `*<#C0M8PUPU6>* is where people go to _ship_, or share, projects they've made. All posts in that are not part of a thread must be projects you've made, and must include a link or attachment. Check out the awesome projects people in the community have made!`
  const codeDesc = `*<#C0EA9S0A0>* is where people go to ask technical questions about code. If you're stuck on a problem or need some guidance, this is the place to go. `
  
  // channel descriptions
  await sendMessage(body.channel.id, hqDesc, 10, finalTs)
  await sendMessage(body.channel.id, loungeDesc, 10, finalTs)
  await sendMessage(body.channel.id, shipDesc, 10, finalTs)
  await sendMessage(body.channel.id, codeDesc, 10, finalTs)
  await sendMessage(body.channel.id, `Here are a bunch of other active channels that you may be interested in:`, 10, finalTs)
  await sendMessage(body.channel.id, `<#C0JDWKJVA> <#C0NP503L7> <#C6LHL48G2> <#C0DCUUH7E> <#CA3UH038Q> <#C90686D0T> <#CCW6Q86UF> <#C1C3K2RQV> <#CCW8U2LBC> <#CDLBHGUQN> <#CDJV1CXC2> <#C14D3AQTT> <#CBX54ACPJ> <#CC78UKWAC> <#C8P6DHA3W> <#C010SJJH1PT> <#CDJMS683D> <#CDN99BE9L>`, 10, finalTs)
  
  await completeTutorial(body.user.id)
  
  // add user to default channels
  await inviteUserToChannel(body.user.id, 'C0C78SG9L') //hq
  await inviteUserToChannel(body.user.id, 'C0266FRGV') //lounge
  await inviteUserToChannel(body.user.id, 'C0M8PUPU6') //ship
  await inviteUserToChannel(body.user.id, 'C0EA9S0A0') //code

  await sendEphemeralMessage('C0C78SG9L', hqDesc, body.user.id)
  await sendEphemeralMessage('C0266FRGV', loungeDesc, body.user.id)
  await sendEphemeralMessage('C0M8PUPU6', shipDesc, body.user.id)
  await sendEphemeralMessage('C0EA9S0A0', codeDesc, body.user.id)
  
  await sendMessage(body.channel.id, `Your next steps: start talking to the community! Pick a few channels that you like from the thread above and start talking. We're excited to meet you :partyparrot:`)
  await sendMessage(body.channel.id, `I also highly recommend setting a profile picture. It makes you look a lot more like a real person :)`)
  await sendMessage(body.channel.id, `I'm going to head out now—if you have any questions about Hack Club or Slack that I didn't answer, please ask in <#C0C78SG9L> or send a Direct Message to <@U4QAK9SRW>.`)
  await sendMessage(body.channel.id, `Toodles! :wave:`)
  await timeout(3000)
  await sendSingleBlockMessage(body.channel.id, `(Btw, if you want to leave + archive this channel, click here)`, 'Leave channel', 'leave_channel')
})

app.action('leave_channel', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, `(Btw, if you want to leave + archive this channel, click here)`)
  await sendSingleBlockMessage(body.channel.id, `Are you sure? You won't be able to come back to this channel.`, `Yes, I'm sure`, 'leave_confirm')
})
app.action('leave_confirm', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, `Okay! Bye :wave:`)

  // invite matthew to the private channel & archive it
  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: body.channel.id,
    users: `U4QAK9SRW`
  })
  await app.client.conversations.archive({
    token: process.env.SLACK_OAUTH_TOKEN,
    channel: body.channel.id
  })
})

app.event('member_joined_channel', async body => {
  const completed = await hasCompletedTutorial(body.event.user)
  if (body.event.channel !== 'C75M7C0SY' && !completed) {
    const members = await app.client.conversations.members({
      token: process.env.SLACK_BOT_TOKEN,
      channel: body.event.channel
    })
    if (!(members.members.includes('U4QAK9SRW'))) { // user who owns the oauth, in this case @matthew
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
    await sendMessage(body.event.user, `It looks like you tried to join <#${body.event.channel}>. You can't join any channels yet—I need to finish helping you join the community first.`, 10)
  }
});

async function sendMessage(channel, text, delay, ts, unfurl) {
  await timeout(delay || 3000)
  const msg = await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    text: text,
    thread_ts: null || ts,
    unfurl_links: unfurl ? unfurl : false
  })
  return msg
}

async function sendEphemeralMessage(channel, text, user) {
  await app.client.chat.postEphemeral({
    token: process.env.SLACK_BOT_TOKEN,
    attachments: [],
    channel: channel,
    text: text,
    user: user
  })
}

async function startTutorial(user, restart) {
  const islandName = await generateIslandName()
  const newChannel = await app.client.conversations.create({
    token: process.env.SLACK_BOT_TOKEN,
    name: islandName.channel,
    is_private: true,
    user_ids: process.env.BOT_USER_ID
  })
  const channelId = newChannel.channel.id
  
  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    users: user
  })
  .catch (err => console.log(err.data.errors))
  
  if (restart) {
    let record = await getUserRecord(user)
    if (typeof record === 'undefined') {
      record = await islandTable.create({
        'Name': user,
        'Island Channel ID': channelId,
        'Island Channel Name': islandName.channel,
        'Has completed tutorial': false
      })
    }
    await islandTable.update(record.id, {
      'Island Channel ID': channelId,
      'Island Channel Name': islandName.channel,
      'Has completed tutorial': false
    })
  } else {
      await islandTable.create({
        'Name': user,
        'Island Channel ID': channelId,
        'Island Channel Name': islandName.channel,
        'Has completed tutorial': false
      })
  }

  await sendSingleBlockMessage(channelId, `Hi, I'm Clippy! I'm the Hack Club assistant and my job is to get you on the Slack. Do you need assistance?`, `What the heck? Who are you?`, `intro_progress`)
}

async function sendSingleBlockMessage(channel, text, blockText, actionId) {
  await timeout(3000)
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": text
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": blockText,
              "emoji": true
            },
            "action_id": actionId
          }
        ]
      }
    ]
  })
}

async function updateInteractiveMessage(ts, channel, message) {
  const result = await app.client.chat.update({
      token: process.env.SLACK_BOT_TOKEN,
      // ts of message to update
      ts: ts,
      // Channel of message
      channel: channel,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ],
      text: 'Message from Test App'
    });
}

async function inviteUserToChannel(user, channel) {
  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    users: user
  }).catch(err => {
    if (err.data.error === 'already_in_channel') {
      console.log(`${user} is already in ${channel}—skipping this step...`)
    }
  })
}

async function getIslandId(userId) {
  let record = await getUserRecord(userId)
  if (typeof record === 'undefined') return null
  return record.fields['Island Channel ID']
}
async function getIslandName(userId) {
  let record = await getUserRecord(userId)
  return record.fields['Island Channel Name']
}

async function getNextEvent() {
  let record = (await eventsTable.read({
    view: 'Future Events',
    maxRecords: 1
  }))[0]
  const eventUrl = `https://events.hackclub.com/${slugger.slug(record.fields['Title'])}`
  
  return {
    name: record.fields['Title'],
    day: record.fields['Date (formatted)'],
    time: record.fields['Time (formatted)'],
    url: eventUrl
  }
}

async function getLastBotMessage(channel) {
  const history = await app.client.conversations.history({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel
  })
  const botHistory = history.messages.filter(
    message => message.user === "U012CUN4U1X"
  )
  return botHistory[0].text
}

async function generateIslandName() {
  const words = friendlyWords.predicates
  const word1 = words[Math.floor(Math.random() * 1455)]
  const word2 = words[Math.floor(Math.random() * 1455)]
  const channel = `${word1}-${word2}-island`
  const pretty = `${capitalizeFirstLetter(word1)} ${capitalizeFirstLetter(word2)} Tutorial Island`
  
  const taken = await checkIslandNameTaken(channel)
  if (taken) return generateIslandName()
  
  return {
    channel: channel,
    pretty: pretty
  }
}

async function completeTutorial(userId) {
  let record = await getUserRecord(userId)
  await islandTable.update(record.id, { 'Has completed tutorial': true })
}

async function hasCompletedTutorial(userId) {
  let record = await getUserRecord(userId)
  if (typeof record === 'undefined') return true
  return record.fields['Has completed tutorial']
}

async function getUserRecord(userId) {
  try {
    let record = (await islandTable.read({
      filterByFormula: `{Name} = '${userId}'`,
      maxRecords: 1
    }))[0]
    return record
  } catch {}
}

async function checkIslandNameTaken(islandName) {
  let record = (await islandTable.read({
    filterByFormula: `{Island Channel Name} = '${islandName}'`,
    maxRecords: 1
  }))[0]
  return record !== undefined
}

function messageIsPartOfTutorial(body, correctChannel) {
  return body.event.channel_type === 'group' && body.event.subtype !== 'group_join'
      && body.event.subtype !== 'channel_join' && body.event.user !== 'U012CUN4U1X'
      && body.event.channel === correctChannel
}

function capitalizeFirstLetter(str) {
  return str[0].toUpperCase() + str.slice(1)
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
