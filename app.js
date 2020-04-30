const { App } = require("@slack/bolt")
const AirtablePlus = require('airtable-plus')
const friendlyWords = require('friendly-words')
const GithubSlugger = require('github-slugger')
const slugger = new GithubSlugger()
const axios = require('axios')

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

let pronouns
let pronoun_1

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
  updateInteractiveMessage(body.message.ts, body.channel.id, `Hi, I'm Clippy! My job is to get you on the Slack. Do you need assistance?`)

  updatePushedButton(body.user.id)
  await sendMessage(body.channel.id, '...', 1000)
  await sendMessage(body.channel.id, '...', 1000)
  await sendMessage(body.channel.id, `Excellent! I'm happy to assist you in joining Hack Club today.`, 1000)
  await sendMessage(body.channel.id, `A few quick questions:`)

  await timeout(3000)
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: body.channel.id,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `What are your pronouns? (how you want to be referred to by others)`
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
              "text": "she/her/hers"
            },
            "style": "primary",
            "action_id": "she"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "he/him/his"
            },
            "style": "primary",
            "action_id": "he"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "they/them/theirs"
            },
            "style": "primary",
            "action_id": "they"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "something else"
            },
            "style": "primary",
            "action_id": "something_else"
          }
        ]
      }
    ]
  })
});

app.action('she', async ({ ack, body }) => {
  ack();
  await setPronouns(body.user.id, 'she/her/hers', 'she')
  updateSingleBlockMessage(body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `she/her/hers`, `mimmiggie`)
  await sendMessage(body.channel.id, `:heart: Every profile here has a custom field for pronouns—I recommend adding yours there to let others know! <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|Here's a quick tutorial.>`)
  sendHsQuestion(body.channel.id)
});

app.action('he', async ({ ack, body }) => {
  ack();
  await setPronouns(body.user.id, 'he/him/his', 'he')
  updateSingleBlockMessage(body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `he/him/his`, `mimmiggie`)
  await sendMessage(body.channel.id, `:heart: Every profile here has a custom field for pronouns—I recommend adding yours there to let others know! <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|Here's a quick tutorial.>`)
  sendHsQuestion(body.channel.id)
});


app.action('they', async ({ ack, body }) => {
  ack();
  await setPronouns(body.user.id, 'they/them/theirs', 'they')
  updateSingleBlockMessage(body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `they/them/theirs`, `mimmiggie`)
  await sendMessage(body.channel.id, `:heart: Every profile here has a custom field for pronouns—I recommend adding yours there to let others know! <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|Here's a quick tutorial.>`)
  sendHsQuestion(body.channel.id)
});

app.action('something_else', async ({ ack, body }) => {
  ack();
  await sendMessage(body.channel.id, `What are your preferred pronouns? (Type your answer in chat)`)
});

app.action('hs_yes', async ({ ack, body }) => {
  ack();
  updateSingleBlockMessage(body.message.ts, body.channel.id, `Are you currently a high school student? (it's OK if you're not)`, `Yes`, `mimmiggie`)
  await sendMessage(body.channel.id, 'Hack Club is a community of high schoolers, so you\'ll fit right in!')
  await sendMessage(body.channel.id, `What brings you to the Hack Club community? (Type your answer in the chat)`)
});

app.action('hs_no', async ({ ack, body }) => {
  ack();
  updateSingleBlockMessage(body.message.ts, body.channel.id, `Are you currently a high school student? (it's OK if you're not)`, `No`, `mimmiggie`)
  await sendMessage(body.channel.id, 'Just a heads-up: Hack Club is a community of high schoolers, not a community of professional developers. You will likely still find a home here if you are in college, but if you\'re older than that, you may find yourself lost here.')
  await sendSingleBlockMessage(body.channel.id, 'If you understand this and still want to continue on, click the 👍 below.', '👍', 'hs_acknowledge')
});

app.action('hs_acknowledge', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, '👍')
  await sendMessage(body.channel.id, `What brings you to the Hack Club community? (Type your answer in the chat)`)
});

app.action('mimmiggie', async ({ ack, body }) => {
  ack();
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

    if (lastBotMessage.includes('What are your preferred pronouns')) {

      let pronouns = lastUserMessage
      let pronoun1 = lastUserMessage.slice(0, lastUserMessage.search("/"))
      await setPronouns(body.event.user, pronouns, pronoun1.toLowerCase())

      await sendMessage(body.event.channel, `:heart: Every profile here has a custom field for pronouns—I recommend adding yours there to let others know! <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|Here's a quick tutorial.>`)
      await sendHsQuestion(body.event.channel)
    }

    if (lastBotMessage.includes('What brings you')) {
      // send it to welcome-committee
      let userPronouns = await getPronouns(body.event.user)
      let pronouns = userPronouns.pronouns
      let pronoun1 = userPronouns.pronoun1

      await sendMessage('GLFAEL1SL', 'New user <@' + body.event.user + '> (' + pronouns + ') joined! Here\'s why ' + pronoun1 + ' joined the Hack Club community:\n\n' + lastUserMessage + '\n\nReact to this message to take ownership on reaching out.', 10)

      await sendMessage(body.event.channel, `Ah, very interesting! Well, let me show you around the community.`)
      await sendMessage(body.event.channel, `You're currently on Slack, the platform our community uses. It's like Discord, but better.`)
      await sendMessage(body.event.channel, `Slack is organized into "channels". We have _hundreds_ of channels in our Slack, covering everything from <#C6LHL48G2> and <#C0EA9S0A0> to <#CBX54ACPJ> and <#C010SJJH1PT>. I'll show you a few of my favorites in a minute.`, 5000)
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
  await sendMessage(body.channel.id, `The next community event is called *${nextEvent.name}*, and it's happening on ${nextEvent.day} at ${nextEvent.time} eastern time. You can <${nextEvent.url}|learn more about the event by clicking here>. We'd love to see you there!`, 5000)
  await sendMessage(body.channel.id, `Our favorite recurring community event is called <#C0JDWKJVA>. Hack Night is a biweekly call where we all get together and hang out, build things, and have fun! Hack Night happens on Saturdays at 8:30pm eastern and Wednesdays at 3:30pm eastern. We'd love to see you at the next one!`, 7000)
  await sendMessage(body.channel.id, `We also have a community-wide currency called gp! Right now, you can only use it for <#CSHEL6LP5>, <#CN9LWFDQF>, and <#CL4DMMCLQ>—but stay tuned for more super exciting uses!`, 5000)

  await sendMessage(body.channel.id, `Let me start you off with some gp.`)
  await sendGP(body.user.id, body.channel.id, 20)
  await sendMessage(body.channel.id, `You can check your balance at anytime by typing \`/balance\``)

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
  await sendMessage(body.channel.id, `<#C0JDWKJVA> <#C0NP503L7> <#C6LHL48G2> <#C0DCUUH7E> <#CA3UH038Q> <#C90686D0T> <#CCW6Q86UF> <#C1C3K2RQV> <#CCW8U2LBC> <#CDLBHGUQN> <#CDJV1CXC2> <#C14D3AQTT> <#CBX54ACPJ> <#CC78UKWAC> <#C8P6DHA3W> <#C010SJJH1PT> <#CDJMS683D> <#CDN99BE9L> <#CSHEL6LP5>`, 10, finalTs)

  let pronouns = getPronouns(body.user.id)
  if (pronouns.pronouns === "they/them/theirs" || pronouns.pronouns === "she/her/hers") {
    await sendMessage(body.channel.id, `Also, check out <#CFZMXJ3FB>—it’s a channel for women/femme/non-binary people in Hack Club!`, 1000)
  }

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
  await sendSingleBlockMessage(body.channel.id, `Are you sure? You won't be able to come back to this channel.`, `Yes, I'm sure`, 'leave_confirm', 10)
})
app.action('leave_confirm', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, `Okay! Bye :wave:`)

  await app.client.conversations.archive({
    token: process.env.SLACK_OAUTH_TOKEN,
    channel: body.channel.id
  })
})

app.event('member_joined_channel', async body => {
  const completed = await hasCompletedTutorial(body.event.user)
  if (body.event.channel !== 'C75M7C0SY' && !completed && !body.event.bot_id) {
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
    let islandName = await getIslandName(body.event.user)
    console.log(islandId)
    console.log(islandName)
    await sendEphemeralMessage(islandId, `<@${body.event.user} It looks like you tried to join <#${body.event.channel}>. You can't join any channels yet—I need to finish helping you join the community first.`, body.event.user)
    await sendEphemeralMessage(body.event.channel, `<@${body.event.user} It looks like you tried to join <#${body.event.channel}>. You can't join any channels yet—I need to finish helping you join the community first. Head back over to <${`https://hackclub.slack.com/archives/${islandId}`}|#${islandName}> to unlock the rest of the community.`, body.event.user)
  }
});

async function sendHsQuestion(channel) {
  await timeout(3000)
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
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
}

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
  console.log(`New tutorial channel created: ${channelId}`)

  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    users: user
  })
    .catch(err => console.log(err.data.errors))
  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    users: 'U012FPRJEVB'
  })

  await app.client.conversations.setTopic({
    token: process.env.SLACK_OAUTH_TOKEN,
    channel: channelId,
    topic: `Welcome to Hack Club! :wave: Unlock the community by completing this tutorial.`
  })

  if (restart) {
    let record = await getUserRecord(user)
    if (typeof record === 'undefined') {
      record = await islandTable.create({
        'Name': user,
        'Island Channel ID': channelId,
        'Island Channel Name': islandName.channel,
        'Has completed tutorial': false,
        'Pushed first button': false
      })
    }
    await islandTable.update(record.id, {
      'Island Channel ID': channelId,
      'Island Channel Name': islandName.channel,
      'Has completed tutorial': true,
      'Pushed first button': false
    })
  } else {
    await islandTable.create({
      'Name': user,
      'Island Channel ID': channelId,
      'Island Channel Name': islandName.channel,
      'Has completed tutorial': false,
      'Pushed first button': false
    })
  }

  let firstMessage = await sendSingleBlockMessage(channelId, `Hi, I'm Clippy! My job is to get you on the Slack. Do you need assistance?`, `What the heck? Who are you?`, `intro_progress`, 10)

  await timeout(30000)
  let pushedButton = await hasPushedButton(user)
  if (!pushedButton) {
    await sendMessage(channelId, `(<@${user}> Psst—every new member completes this intro to unlock the Hack Club community. Hit the button above to begin :star2:)`, 10)
    await updateSingleBlockMessage(firstMessage.message.ts, channelId, `Hi, I'm Clippy! My job is to get you on the Slack. Do you need assistance?`, `What the heck? Who are you? 🌟`, `intro_progress`)
  }
}

async function sendSingleBlockMessage(channel, text, blockText, actionId, delay) {
  await timeout(delay || 3000)
  let message = await app.client.chat.postMessage({
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
  return message
}

async function updateSingleBlockMessage(ts, channel, text, blockText, actionId) {
  await app.client.chat.update({
    token: process.env.SLACK_BOT_TOKEN,
    ts: ts,
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

async function setPronouns(userId, pronouns, pronoun1) {
  let record = await getUserRecord(userId)
  console.log(record)
  let recId = record.id

  islandTable.update(recId, {
    'Pronouns': pronouns,
    'Pronoun 1': pronoun1
  })
}

async function getPronouns(userId) {
  let userRecord = await getUserRecord(userId)
  let pronouns = userRecord.fields['Pronouns']
  let pronoun1 = userRecord.fields['Pronoun 1']
  return {
    pronouns: pronouns,
    pronoun1: pronoun1
  }
}

async function updatePushedButton(userId) {
  let record = await getUserRecord(userId)
  let recId = record.id

  islandTable.update(recId, {
    'Pushed first button': true
  })
}

async function hasPushedButton(userId) {
  let record = await getUserRecord(userId)
  return record.fields['Pushed first button']
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

async function sendGP(user, channel, amount) {
  const completed = await hasCompletedTutorial(user)
  if (completed) {
    console.log(`${user} has completed this tutorial before, so I won't give them the gp.`)
    await sendMessage(channel, `(Looks like you completed this tutorial before, so I won't give you the gp this time)`, 1000)
  }
  else {
    axios.post('https://bankerapi.glitch.me/give', {
      'token': process.env.BANKER_TOKEN,
      'send_id': user,
      'bot_id': process.env.BOT_USER_ID,
      'gp': amount,
      'reason': 'Starting you off!'
    })
      .then(response => console.log(response))
      .catch(err => console.log(err))
  }
}

async function generateIslandName() {
  const words = friendlyWords.predicates
  const word1 = words[Math.floor(Math.random() * 1455)]
  const word2 = words[Math.floor(Math.random() * 1455)]
  const channel = `${word1}-${word2}-tutorial`
  const pretty = `${capitalizeFirstLetter(word1)} ${capitalizeFirstLetter(word2)} Tutorial`

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
  } catch { }
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
