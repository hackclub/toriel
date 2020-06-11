const AirtablePlus = require('airtable-plus')
const friendlyWords = require('friendly-words')
const GithubSlugger = require('github-slugger')
const slugger = new GithubSlugger()

const { defaultIntro, som } = require('./intros')

const islandTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: 'appYGt7P3MtotTotg',
  tableName: 'Tutorial Island'
})
exports.islandTable = islandTable

const eventsTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: 'appezi7TOQFt8vTfa',
  tableName: 'Events'
})
exports.eventsTable = eventsTable

const startTutorial = async (app, user, flow, restart) => {
  const islandName = await generateIslandName()
  const newChannel = await app.client.conversations.create({
    token: process.env.SLACK_BOT_TOKEN,
    name: islandName.channel,
    is_private: true,
    user_ids: process.env.BOT_USER_ID
  })
  const channelId = newChannel.channel.id

  if (restart) {
    let record = await getUserRecord(user)
    if (typeof record === 'undefined') {
      record = await islandTable.create({
        'Name': user,
        'Island Channel ID': channelId,
        'Island Channel Name': islandName.channel,
        'Has completed tutorial': false,
        'Has previously completed tutorial': false,
        'Pushed first button': false,
        'Flow': flow === 'default' ? 'Default' : 'Summer of Making'
      })
    }
    await islandTable.update(record.id, {
      'Island Channel ID': channelId,
      'Island Channel Name': islandName.channel,
      'Has completed tutorial': true,
      'Pushed first button': false,
      'Flow': flow === 'default' ? 'Default' : 'Summer of Making'
    })
  } else {
    await islandTable.create({
      'Name': user,
      'Island Channel ID': channelId,
      'Island Channel Name': islandName.channel,
      'Has completed tutorial': false,
      'Has previously completed tutorial': false,
      'Pushed first button': false,
      'Flow': flow === 'default' ? 'Default' : 'Summer of Making'
    })
  }
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
    users: 'U012FPRJEVB' //Clippy Admin
  })
  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    users: 'UH50T81A6' //banker
  })

  await app.client.conversations.setTopic({
    token: process.env.SLACK_OAUTH_TOKEN,
    channel: channelId,
    topic: `Welcome to Hack Club! :wave: Unlock the community by completing this tutorial.`
  })

  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    blocks: flow === 'default' ? defaultIntro : som
  })

  await timeout(30000)
  let pushedButton = await hasPushedButton(user)
  if (!pushedButton) {
    await sendMessage(app, channelId, `(<@${user}> Psst—every new member completes this quick intro to unlock the Hack Club community. It only takes 1 minute—I promise—and you get free stuff along the way. Click any of the three buttons above to begin :star2: :money_with_wings: :eye:)`, 10)
  }
}
exports.startTutorial = startTutorial

const sendMessage = async (app, channel, text, delay, ts, unfurl) => {
  await timeout(delay || 3000)
  const msg = await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    text: text,
    thread_ts: null || ts,
    unfurl_links: unfurl || false
  })
  return msg
}
exports.sendMessage = sendMessage

const sendEphemeralMessage = async (app, channel, text, user) => {
  return await app.client.chat.postEphemeral({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    text: text,
    user: user,
  })
}
exports.sendEphemeralMessage = sendEphemeralMessage

const getIslandId = async (userId) => {
  let record = await getUserRecord(userId)
  if (typeof record === 'undefined') return null
  return record.fields['Island Channel ID']
}
exports.getIslandId = getIslandId

const getLatestMessages = async (app, channelId) => {
  const history = await app.client.conversations.history({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId
  })
  const botHistory = history.messages.filter(
    message => message.user === process.env.BOT_USER_ID
  )
  const lastBotMessage = botHistory[0].text
  const lastUserMessage = history.messages[0].text

  return {
    lastBotMessage: lastBotMessage,
    lastUserMessage: lastUserMessage,
    latestReply: botHistory[0].latest_reply,
    latestTs: botHistory[0].ts
  }
}
exports.getLatestMessages = getLatestMessages

const sendSingleBlockMessage = async (app, channel, text, blockText, actionId, delay) => {
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
exports.sendSingleBlockMessage = sendSingleBlockMessage

const updateSingleBlockMessage = async (app, ts, channel, text, blockText, actionId) => {
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
exports.updateSingleBlockMessage = updateSingleBlockMessage

const updateInteractiveMessage = async (app, ts, channel, message) => {
  const result = await app.client.chat.update({
    token: process.env.SLACK_BOT_TOKEN,
    ts: ts,
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
exports.updateInteractiveMessage = updateInteractiveMessage

const sendDoubleBlockMessage = async (app, channel, text, blockText1, blockText2, actionId1, actionId2) => {
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    blocks: [
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
              "emoji": true,
              "text": blockText1
            },
            "style": "primary",
            "action_id": actionId1
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": blockText2
            },
            "style": "danger",
            "action_id": actionId2
          }
        ]
      }
    ]
  })
}
exports.sendDoubleBlockMessage = sendDoubleBlockMessage

const inviteUserToChannel = async (app, user, channel) => {
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
exports.inviteUserToChannel = inviteUserToChannel

const setPronouns = async (app, userId, pronouns, pronoun1) => {
  let record = await getUserRecord(userId)
  let recId = record.id

  await islandTable.update(recId, {
    'Pronouns': pronouns,
    'Pronoun 1': pronoun1
  })
  await app.client.users.profile.set({
    token: process.env.SLACK_OAUTH_TOKEN,
    profile: { 'XfD4V9MG3V': pronouns },
    user: userId
  })
}
exports.setPronouns = setPronouns

const getPronouns = async userId => {
  let userRecord = await getUserRecord(userId)
  let pronouns = userRecord.fields['Pronouns']
  let pronoun1 = userRecord.fields['Pronoun 1']
  return {
    pronouns: pronouns,
    pronoun1: pronoun1
  }
}
exports.getPronouns = getPronouns

const hasPreviouslyCompletedTutorial = async userId => {
  let userRecord = await getUserRecord(userId)
  let completed = userRecord.fields['Has previously completed tutorial']
  return completed
}
exports.hasPreviouslyCompletedTutorial = hasPreviouslyCompletedTutorial

const setPreviouslyCompletedTutorial = async userId => {
  let userRecord = await getUserRecord(userId)
  let recId = userRecord.id

  islandTable.update(recId, {
    'Has previously completed tutorial': true
  })
}
exports.setPreviouslyCompletedTutorial = setPreviouslyCompletedTutorial

const setFlow = async (userId, flow) => {
  let userRecord = await getUserRecord(userId)
  await islandTable.update(userRecord.id, {
    'Flow': flow
  })
}
exports.setFlow = setFlow

const updatePushedButton = async userId => {
  let record = await getUserRecord(userId)
  let recId = record.id

  islandTable.update(recId, {
    'Pushed first button': true
  })
}
exports.updatePushedButton = updatePushedButton

const getIslandName = async userId => {
  let record = await getUserRecord(userId)
  return record.fields['Island Channel Name']
}
exports.getIslandName = getIslandName

const hasPushedButton = async userId => {
  let record = await getUserRecord(userId)
  if (typeof record === 'undefined') return true
  return record.fields['Pushed first button']
}
exports.hasPushedButton = hasPushedButton

const hasCompletedTutorial = async userId => {
  let record = await getUserRecord(userId)
  if (typeof record === 'undefined') return true
  return (record.fields['Has completed tutorial'] || record.fields['Club leader'])
}
exports.hasCompletedTutorial = hasCompletedTutorial

const isBot = async (app, userId) => {
  const user = await app.client.users.info({
    token: process.env.SLACK_OAUTH_TOKEN,
    user: userId
  })
  return user.user.is_bot
}
exports.isBot = isBot

const getUserRecord = async userId => {
  try {
    let record = (await islandTable.read({
      filterByFormula: `{Name} = '${userId}'`,
      maxRecords: 1
    }))[0]
    return record
  } catch { }
}
exports.getUserRecord = getUserRecord

const checkIslandNameTaken = async islandName => {
  let record = (await islandTable.read({
    filterByFormula: `{Island Channel Name} = '${islandName}'`,
    maxRecords: 1
  }))[0]
  return record !== undefined
}
exports.checkIslandNameTaken = checkIslandNameTaken

const getNextEvent = async () => {
  try {
    let record = (await eventsTable.read({
      view: 'Future Events',
      maxRecords: 1
    }))[0]

    let eventUrl = `https://events.hackclub.com/${slugger.slug(record.fields['Title'])}`

    return {
      name: record.fields['Title'],
      day: record.fields['Date (formatted)'],
      time: record.fields['Time (formatted)'],
      url: eventUrl
    }
  } catch {
    return null
  }
}
exports.getNextEvent = getNextEvent

const generateIslandName = async () => {
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
exports.generateIslandName = generateIslandName

const completeTutorial = async userId => {
  let record = await getUserRecord(userId)
  await islandTable.update(record.id, {
    'Has completed tutorial': true
  })
}
exports.completeTutorial = completeTutorial

const messageIsPartOfTutorial = (body, correctChannel) => {
  return body.event.channel_type === 'group' && body.event.subtype !== 'group_join'
    && body.event.subtype !== 'channel_join' && body.event.user !== 'U012CUN4U1X'
    && body.event.channel === correctChannel
}
exports.messageIsPartOfTutorial = messageIsPartOfTutorial

const capitalizeFirstLetter = str => {
  return str[0].toUpperCase() + str.slice(1)
}
exports.capitalizeFirstLetter = capitalizeFirstLetter

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
exports.timeout = timeout