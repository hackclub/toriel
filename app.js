const { App } = require("@slack/bolt")
const AirtablePlus = require('airtable-plus')
const friendlyWords = require('friendly-words')
const GithubSlugger = require('github-slugger')
const slugger = new GithubSlugger()

const islandTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: 'appcstNeqDROujKE7',
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

app.event("team_join", async body => {
  //console.log(body)
  //console.log(body.event.user)
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
    users: body.event.user.id
  })
  .catch (err => console.log(err.data.errors))

  await islandTable.create({
    'Name': body.event.user.id,
    'Island Channel ID': channelId,
    'Island Channel Name': islandName.channel,
    'Has completed tutorial': false
  })
  
  await sendMessage(channelId, `Welcome to the Hack Club Slack! This is your personal island, the ${islandName.pretty}.`, 10)
  await sendMessage(channelId, `I'm the Gatekeeper, a bot that guards the community and welcomes new members. Before you enter the community, I want to get to know you a little bit and show you around.`)
  await timeout(3000)
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `Before we get started, a quick question: are you a high schooler?`
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

app.event('message', async body => {
  const correctChannel = await getIslandId(body.event.user)
  //console.log(correctChannel)
  if (body.event.channel_type === 'group' && body.event.subtype !== 'group_join'
      && body.event.subtype !== 'channel_join' && body.event.user !== 'U012CUN4U1X'
      && body.event.channel === correctChannel) {
    const history = await app.client.conversations.history({
      token: process.env.SLACK_BOT_TOKEN,
      channel: body.event.channel
    })
    const botHistory = history.messages.filter(
      message => message.user === 'U012CUN4U1X'
    )
    //console.log(history)
    const lastBotMessage = botHistory[0].text
    const lastUserMessage = history.messages[0].text
    //console.log(lastBotMessage)
    //console.log(lastUserMessage)
    
    if (lastBotMessage.includes('what brings you')) {
      // send it to welcome-committee
      await sendMessage(body.event.channel, `Ah, very interesting! Well, anyway, let me show you around the Slack.`)
      
      await sendMessage('C011YTBQ205', 'New user <@' + body.event.user + '> joined! Here\'s why they joined the Hack Club community:\n\n' + lastUserMessage, 10)
      await sendMessage(body.event.channel, `Our community is on a platform called Slack. Slack is organized into "channels", where each channel includes discussion about its own topic. I just invited you to your first channel, <#C0122U8G28M>. Click on <#C0122U8G28M> in your sidebar to join the channel, and introduce yourself to the community.`)
      await timeout(3000)
      await sendThumbsUpMessage(body.event.channel, "When you're ready, click the 👍 on this message to continue the tutorial.", 'introduced')
      
      // add user to #welcome
      await app.client.conversations.invite({
        token: process.env.SLACK_BOT_TOKEN,
        channel: 'C0122U8G28M',
        users: body.event.user
      })
      const island = await getIslandName(body.event.user)
      await app.client.chat.postEphemeral({
        token: process.env.SLACK_BOT_TOKEN,
        attachments: [],
        channel: 'C0122U8G28M',
        text: `Feel free to introduce yourself to the community in <#C0122U8G28M>. When you're done, head back to <https://tutorialislan-kyy9681.slack.com/archives/${island}|#${island}> to continue your introduction to the community.`,
        user: body.event.user
      })
    }
  }
});

app.event('member_joined_channel', async body => {
  //console.log(body) body.event.channel body.event.user
  const completed = await hasCompletedTutorial(body.event.user)
  if (body.event.channel !== 'C0122U8G28M' && !completed) {
    const members = await app.client.conversations.members({
      token: process.env.SLACK_BOT_TOKEN,
      channel: body.event.channel
    })
    if (!(members.members.includes('U012CUN4U1X'))) { // user who owns the oauth, in this case @matthew
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
    await sendMessage(body.event.user, `Hey, just noticed you tried to join <#${body.event.channel}>. You can't join any channels yet—you have to complete this tutorial first.`, 10)
  }
});

app.action('introduced', async ({ ack, body }) => {
  ack();
  updateInteractiveMessage(body.message.ts, body.channel.id, 'Awesome! Let\'s keep going.')
  
  const nextEvent = await getNextEvent()
  await sendMessage(body.channel.id, `There are awesome things happening in the Hack Club community every day! Check out #announcements to see the latest community event. We do everything from coding challenges to AMAs with famous people (e.g. Tom Preston-Werner) to fun hangouts, and more!`)
  await sendMessage(body.channel.id, `The next community event is called *${nextEvent.name}*, and it's happening on ${nextEvent.day} at ${nextEvent.time} eastern time. You can <${nextEvent.url}|learn more about the event by clicking here>. We'd love to see you there!`)
  await sendMessage(body.channel.id, `Our favorite recurring community event is called #hack-night. Hack Night is a biweekly call where we all get together and hang out, chat, build things, and have fun! Hack Night happens on Saturdays at 8:30pm eastern and Wednesdays at 3:30pm eastern. Feel free to join #hack-night—we'd love to see you there!`, 7000)
  await sendMessage(body.channel.id, `We also have a community-wide currency called gp! Type /market to see what you can do with it.`)
  await sendMessage(body.channel.id, `Almost done! One last thing: please make sure to read our <${`https://hackclub.com/conduct`}|code of conduct>. All community members are expected to follow the code of conduct.`, 5000)
  await sendThumbsUpMessage(body.channel.id, `Once you've read the code of conduct, click the 👍 to continue with the tutorial.`, `coc_acknowledge`)
  //finishTutorial(body.channel.id, body.user.id)
});

app.action('hs_yes', async ({ ack, body }) => {
  ack();
  //console.log(body)
  updateInteractiveMessage(body.message.ts, body.channel.id, 'Hack Club is a community of high schoolers, so you\'ll fit right in as a high schooler yourself!')
  await sendMessage(body.channel.id, `Let's start with a simple question: *what brings you to the Hack Club community?*`)
});

app.action('hs_no', async ({ ack, body }) => {
  ack();
  //console.log(body)
  await updateInteractiveMessage(body.message.ts, body.channel.id, 'Just a heads-up: Hack Club is a community of high schoolers, not a community of professional developers. You will likely still find a home here if you are in college, but if you\'re older than that, you may find yourself lost here.')
  await sendThumbsUpMessage(body.channel.id, 'If you\'re aware of and are okay with this, click the 👍 below.', 'hs_acknowledge')
});

app.action('hs_acknowledge', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, 'Great!')
  await sendMessage(body.channel.id, `Let's start with a simple question: *what brings you to the Hack Club community?*`)
});

app.action('coc_acknowledge', async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(body.message.ts, body.channel.id, '👍')
  finishTutorial(body.channel.id, body.user.id)
})

async function finishTutorial(channel, user) {
  const finalMessage = await sendMessage(channel, `It's my pleasure to bestow upon you the key to the community. I've added you to a few of the most popular channels, but there are many, many more! Click on "4 replies" to learn more about the channels you were just added to and discover some other cool channels!`, 5000)
  const finalTs = finalMessage.message.ts
  
  // channel descriptions
  await sendMessage(channel, `*<#C011XNL7D54>* is where you can go to ask the community/@staff any questions about Hack Club.`, 10, finalTs)
  await sendMessage(channel, `*<#C012UA3JPSL>* is where you go to hang out with the community. There are no rules or expectations here; just have fun and hang out with the community!`, 10, finalTs)
  await sendMessage(channel, `*<#C011PNM0DPZ>* is where you go to _ship_, or share, projects you've made. All top-level comments must be projects you've made, and must include a link or attachment. Check out the awesome projects people in the community have made!`, 10, finalTs)
  await sendMessage(channel, `Here are a bunch of other active channels that you may be interested in:`, 10, finalTs)
  
  await completeTutorial(user)
  
  // add user to default channels
  await app.client.conversations.invite({ // hq
    token: process.env.SLACK_BOT_TOKEN,
    channel: 'C011XNL7D54',
    users: user
  })
  await app.client.conversations.invite({ // lounge
    token: process.env.SLACK_BOT_TOKEN,
    channel: 'C012UA3JPSL',
    users: user
  })
  await app.client.conversations.invite({ // ship
    token: process.env.SLACK_BOT_TOKEN,
    channel: 'C011PNM0DPZ',
    users: user
  })
}

async function sendThumbsUpMessage(channel, text, actionId) {
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
              "text": "👍",
              "emoji": true
            },
            "style": "primary",
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

async function getIslandId(userId) {
  let record = await getUserRecord(userId)
  if (record === undefined) return null
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
  const channel = `${word1}-${word2}-tutorial-island`
  const pretty = `${capitalizeFirstLetter(word1)} ${capitalizeFirstLetter(word2)} Tutorial Island`
  
  const taken = await checkIslandNameTaken(channel)
  if (taken) return generateIslandName()
  
  return {
    channel: channel,
    pretty: pretty
  }
}

async function sendMessage(channel, text, delay, ts) {
  await timeout(delay || 3000)
  const msg = await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    text: text,
    thread_ts: null || ts,
    unfurl_links: false
  })
  return msg
}

async function completeTutorial(userId) {
  let record = await getUserRecord(userId)
  await islandTable.update(record.id, { 'Has completed tutorial': true })
}

async function hasCompletedTutorial(userId) {
  let record = await getUserRecord(userId)
  return record.fields['Has completed tutorial']
}

async function getUserRecord(userId) {
  let record = (await islandTable.read({
    filterByFormula: `{Name} = '${userId}'`,
    maxRecords: 1
  }))[0]
  if (record === undefined) {
    record = (await islandTable.find('recQKuEkNeNZLbkYq'))
  }
  return record
}

async function checkIslandNameTaken(islandName) {
  let record = (await islandTable.read({
    filterByFormula: `{Island Channel Name} = '${islandName}'`,
    maxRecords: 1
  }))[0]
  return record !== undefined
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
