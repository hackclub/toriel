const axios = require('axios')

const { sendEphemeralMessage, getUserRecord, getIslandId,
  hasPushedButton, hasCompletedTutorial, isBot,
  sendMessage, setPronouns, getPronouns,
  updateSingleBlockMessage, sendSingleBlockMessage, updateInteractiveMessage,
  messageIsPartOfTutorial, inviteUserToChannel, getIslandName,
  getNextEvent, completeTutorial, timeout,
  updatePushedButton, setPreviouslyCompletedTutorial, hasPreviouslyCompletedTutorial,
  generateIslandName, islandTable, getLatestMessages } = require('../utils')

async function defaultFilter(e) {
  //placeholder validation
  const userID = e.body.user_id || (e.body.event ? e.body.event.user : e.body.user.id)
  console.log(userID)
  //return userID === 'U0120F9NAGK'
  //console.log(e.body)
  const flowOptions = {
    maxRecords: 1,
    filterByFormula: `AND(Name = '${userID}', Flow = 'Default')`,
  }
  let data = await axios('https://api2.hackclub.com/v0.1/Tutorial%20Island/Tutorial%20Island?select=' + JSON.stringify(flowOptions)).then(r => r.data)

  const shouldContinue = data[0] != null || e.body.text === ''
  //console.log('Does event pass the default filter?', shouldContinue)
  return shouldContinue
}

async function runInFlow(opts, func) {
  if (await defaultFilter(opts)) {
    return await func(opts)
  }
}

const loadFlow = (app) => {
  app.command('/restart', e => runInFlow(e, async ({ command, ack, say }) => {
    //console.log(command)
    await ack();
    console.log('default')
    startTutorial(body, command.user_id, true)
  }));

  app.event('team_join', async body => {
    const bot = await isBot(app, body.event.user.id)
    if (!bot) await startTutorial(body, body.event.user.id)
  });

  app.action('intro_progress_1', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    console.log(body)
    introProgress(body)
  }));
  app.action('intro_progress_2', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    introProgress(body)
  }));
  app.action('intro_progress_3', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    introProgress(body)
  }));
  app.action('intro_progress', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    introProgress(body)
  }));

  app.action('she', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'she/her/hers', 'she')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `she/her/hers`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    sendHsQuestion(body.channel.id)
  }));

  app.action('he', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'he/him/his', 'he')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `he/him/his`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    sendHsQuestion(body.channel.id)
  }));

  app.action('they', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'they/them/theirs', 'they')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `they/them/theirs`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    sendHsQuestion(body.channel.id)
  }));

  app.action('something_else', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `something else`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `What are your preferred pronouns? (Type your answer in chat)`)
  }));

  app.action('hs_yes', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Are you currently a high school student? (it's OK if you're not)`, `Yes`, `mimmiggie`)
    await sendMessage(app, body.channel.id, 'Hack Club is a community of high schoolers, so you\'ll fit right in!')
    await sendMessage(app, body.channel.id, `What brings you to the Hack Club community? (Type your answer in the chat)`)
  }));

  app.action('hs_no', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Are you currently a high school student? (it's OK if you're not)`, `No`, `mimmiggie`)
    await sendMessage(app, body.channel.id, 'Just a heads-up: Hack Club is a community of high schoolers, not a community of professional developers. You will likely still find a home here if you are in college, but if you\'re older than that, you may find yourself lost here.')
    await sendSingleBlockMessage(app, body.channel.id, 'If you understand this and still want to continue on, click the 👍 below.', '👍', 'hs_acknowledge')
  }));

  app.action('hs_acknowledge', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await updateInteractiveMessage(app, body.message.ts, body.channel.id, '👍')
    await sendMessage(app, body.channel.id, `What brings you to the Hack Club community? (Type your answer in the chat)`)
  }));

  app.event('message', e => runInFlow(e, async body => {
    const correctChannel = await getIslandId(body.event.user)

    if (messageIsPartOfTutorial(body, correctChannel)) {
      const latestMessages = await getLatestMessages(app, body.event.channel)
      const lastBotMessage = latestMessages.lastBotMessage
      const lastUserMessage = latestMessages.lastUserMessage

      if (lastBotMessage.includes('What are your preferred pronouns')) {
        let pronouns = lastUserMessage
        let pronoun1 = lastUserMessage.slice(0, lastUserMessage.search("/"))
        await setPronouns(app, body.event.user, pronouns, pronoun1.toLowerCase())
        await sendMessage(app, body.event.channel, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
        await sendHsQuestion(body.event.channel)
      }

      if (lastBotMessage.includes('What brings you')) {
        if (latestMessages.latestReply) {
          let replies = await app.client.conversations.replies({
            token: process.env.SLACK_BOT_TOKEN,
            channel: body.event.channel,
            ts: latestMessages.latestTs
          })
          sendToWelcomeCommittee(body.event.user, replies.messages[1].text)
        }
        else {
          sendToWelcomeCommittee(body.event.user, lastUserMessage)
        }

        await sendMessage(app, body.event.channel, `Ah, very interesting! Well, let me show you around the community.`)
        await sendMessage(app, body.event.channel, `You're currently on Slack, the platform our community uses. It's like Discord, but better.`)
        await sendMessage(app, body.event.channel, `Slack is organized into "channels". We have _hundreds_ of channels in our Slack, covering everything from <#C6LHL48G2> and <#C0EA9S0A0> to <#CBX54ACPJ> and <#C010SJJH1PT>. I'll show you a few of my favorites in a minute.`, 5000)
        await sendMessage(app, body.event.channel, `I just invited you to your first channel, <#C75M7C0SY>. Join by clicking on it in your sidebar, and feel free to introduce yourself to the community. (totally optional, no expectations)`, 5000)

        // add user to #welcome
        await inviteUserToChannel(app, body.event.user, 'C75M7C0SY')
        const island = await getIslandName(body.event.user)
        await sendEphemeralMessage(app, 'C75M7C0SY', `<@${body.event.user}> Feel free to introduce yourself to the community in <#C75M7C0SY>. When you're done, head back to <https://hackclub.slack.com/archives/${island}|#${island}> to continue your introduction to the community.`, body.event.user)

        await sendSingleBlockMessage(app, body.event.channel, "When you're ready, click the 👍 on this message to continue the tutorial.", '👍', 'introduced')
      }
    }
    let completed = await hasCompletedTutorial(body.event.user)
    if (body.event.channel === 'C75M7C0SY' && !body.event.thread_ts && body.event.subtype !== 'channel_join' && !completed) {
      console.log(body.event.user)
      let ts = body.event.ts.replace('.', '')
      let welcomeLink = `https://hackclub.slack.com/archives/C75M7C0SY/p${ts}`

      let history = await app.client.conversations.history({
        token: process.env.SLACK_BOT_TOKEN,
        channel: 'GLFAEL1SL'
      })

      let welcomeCommitteeMessage = history.messages.find(message => message.text.includes(`New user <@${body.event.user}>`))
      let message = welcomeCommitteeMessage.text
      let welcomeCommitteeTs = welcomeCommitteeMessage.ts

      await sendMessage(app, 'GLFAEL1SL', `:fastparrot: <@${body.event.user}> just introduced themself in <#C75M7C0SY>! ${welcomeLink}`, 10, welcomeCommitteeTs)
      await app.client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        channel: 'GLFAEL1SL',
        ts: welcomeCommitteeTs,
        text: `:fastparrot: ${message}`
      })
    }
  }));

  app.action('introduced', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    updateInteractiveMessage(app, body.message.ts, body.channel.id, '👍')
    await sendMessage(app, body.channel.id, `Awesome! Let's keep going.`)
    await sendMessage(app, body.channel.id, `There are awesome things happening in the Hack Club community every day! Check out <#C0266FRGT> to see the latest community event. We do everything from coding challenges to AMAs with famous people (<${`https://www.youtube.com/watch?v=4beK7VYabjs`}|we even did one with Elon Musk!>) to fun hangouts, and more!`, 3000, null, false)

    const nextEvent = await getNextEvent()
    if (nextEvent !== null) {
      await sendMessage(app, body.channel.id, `The next community event is called *${nextEvent.name}*, and it's happening on ${nextEvent.day} at ${nextEvent.time} eastern time. You can <${nextEvent.url}|learn more about the event by clicking here>. We'd love to see you there!`, 5000)
    }
    else {
      await sendMessage(app, body.channel.id, `There aren't any events coming up in the near future, but keep an eye on <#C0266FRGT> and be sure to check <https://events.hackclub.com|our Events page> to learn when we add new events to our calendar.`)
    }
    await sendMessage(app, body.channel.id, `Our favorite recurring community event is called <#C0JDWKJVA>. Hack Night is a biweekly call where we all get together and hang out, build things, and have fun! Hack Night happens on Saturdays at 8:30pm eastern and Wednesdays at 3:30pm eastern. We'd love to see you at the next one!`, 7000)
    await sendMessage(app, body.channel.id, `I just added you to <#C0M8PUPU6>. Hack Clubbers primarily _ship_, or share projects that they've made, in this channel. Have you made something you're proud of recently? Share it in <#C0M8PUPU6>!`, 5000)
    await inviteUserToChannel(app, body.user.id, 'C0M8PUPU6')

    await sendMessage(app, body.channel.id, `One last thing: please make sure to read our <${`https://hackclub.com/conduct`}|code of conduct>. All community members are expected to follow the code of conduct.`, 5000, null, true)
    await sendSingleBlockMessage(app, body.channel.id, `Once you've read the code of conduct, click the 👍 to finish the tutorial.`, '👍', `coc_acknowledge`)
  }));

  app.action('coc_acknowledge', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await updateInteractiveMessage(app, body.message.ts, body.channel.id, '👍')
    await sendMessage(app, body.channel.id, `That's all from me! I hope I've been able to help you get acquainted with the Hack Club community.`)
    const finalMessage = await sendMessage(app, body.channel.id, `I've added you to a few of the most popular channels, but there are many, many more! Click on "6 replies" to learn more about the channels you were just added to and discover some other cool channels...`, 5000)
    const finalTs = finalMessage.message.ts

    const hqDesc = `*<#C0C78SG9L>* is where people ask the community/@staff any questions about Hack Club.`
    const loungeDesc = `*<#C0266FRGV>* is where people go to hang out with the community. There are no expectations here; just have fun and hang out with the community :)`
    const shipDesc = `*<#C0M8PUPU6>* is where people go to _ship_, or share, projects they've made. All posts in that are not part of a thread must be projects you've made, and must include a link or attachment. Check out the awesome projects people in the community have made!`
    const codeDesc = `*<#C0EA9S0A0>* is where people go to ask technical questions about code. If you're stuck on a problem or need some guidance, this is the place to go. `

    // channel descriptions
    await sendMessage(app, body.channel.id, hqDesc, 10, finalTs)
    await sendMessage(app, body.channel.id, loungeDesc, 10, finalTs)
    await sendMessage(app, body.channel.id, shipDesc, 10, finalTs)
    await sendMessage(app, body.channel.id, codeDesc, 10, finalTs)
    await sendMessage(app, body.channel.id, `Here are a bunch of other active channels that you may be interested in:`, 10, finalTs)
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
      finalTs
    );

    let pronouns = await getPronouns(body.user.id)
    if (pronouns.pronouns === "they/them/theirs" || pronouns.pronouns === "she/her/hers") {
      await sendMessage(app, body.channel.id, `Also, check out <#CFZMXJ3FB>—it’s a channel for women/femme/non-binary people in Hack Club!`, 1000)
    }

    await completeTutorial(body.user.id)
    // add user to default channels
    await inviteUserToChannel(app, body.user.id, 'C0C78SG9L') //hq
    await inviteUserToChannel(app, body.user.id, 'C0266FRGV') //lounge
    //await inviteUserToChannel(app, body.user.id, 'C0M8PUPU6') //ship
    await inviteUserToChannel(app, body.user.id, 'C0EA9S0A0') //code

    await sendEphemeralMessage(app, 'C0C78SG9L', hqDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0266FRGV', loungeDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0M8PUPU6', shipDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0EA9S0A0', codeDesc, body.user.id)

    await sendMessage(app, body.channel.id, `Your next steps: start talking to the community! Pick a few channels that you like from the thread above and start talking. We're excited to meet you :partyparrot:`)
    await sendMessage(app, body.channel.id, `I also highly recommend setting a profile picture. It makes you look a lot more like a real person :)`)
    await sendMessage(app, body.channel.id, `I'm going to head out now—if you have any questions about Hack Club or Slack that I didn't answer, please ask in <#C0C78SG9L> or send a Direct Message to <@U4QAK9SRW>.`)
    await sendMessage(app, body.channel.id, `Toodles! :wave:`)
    await timeout(3000)
    await sendSingleBlockMessage(app, body.channel.id, `(Btw, if you want to leave + archive this channel, click here)`, 'Leave channel', 'leave_channel')
  }));

  app.event('member_joined_channel', e => runInFlow(e, async body => {
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
      await sendEphemeralMessage(app, islandId, `<@${body.event.user}> It looks like you tried to join <#${body.event.channel}>. You can't join any channels yet—I need to finish helping you join the community first.`, body.event.user)
      await app.client.chat.postMessage({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: 'U4QAK9SRW',
        text: `Heads up, I kicked <@${body.event.user}> from <#${body.event.channel}>`
      })
    }
  }));

  app.event('member_left_channel', e => runInFlow(e, async body => {
    const completed = await hasCompletedTutorial(body.event.user)
    const islandId = await getIslandId(body.event.user)
    if (body.event.channel === islandId && !completed) {
      await app.client.conversations.invite({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: body.event.channel,
        user: body.event.user
      })
      await sendEphemeralMessage(app, islandId, `<@${body.event.user}> It looks like you tried to leave your tutorial channel. You can't do that just yet—I need to help you complete the tutorial before you can unlock the rest of the community.`, body.event.user)
    }
  }));

  async function introProgress(body) {
    updateInteractiveMessage(app, body.message.ts, body.channel.id, `Hi, I'm Clippy! My job is to help you join the Hack Club community. Do you need assistance?`)

    updatePushedButton(body.user.id)
    await sendMessage(app, body.channel.id, '...', 1000)
    await sendMessage(app, body.channel.id, '...', 1000)
    await sendMessage(app, body.channel.id, `Excellent! I'm happy to assist you in joining Hack Club today.`, 1000)

    const prevCompleted = await hasPreviouslyCompletedTutorial(body.user.id)
    if (prevCompleted) {
      await sendMessage(app, body.channel.id, `A few quick questions:`)
    } else {
      await sendMessage(app, body.channel.id, `First, the free stuff I promised...`)
      await sendMessage(app, body.channel.id, `<@UH50T81A6> give <@${body.user.id}> 20gp for free stuff!!!`, 1000)
      await setPreviouslyCompletedTutorial(body.user.id)
      await sendMessage(app, body.channel.id, 'You can check your balance at any time by typing `/balance`.', 1000)

      await sendMessage(app, body.channel.id, `Now that that's out of the way, a few quick questions:`, 5000)
    }

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
  }


  async function sendToWelcomeCommittee(userId, text) {
    let userPronouns = await getPronouns(userId)
    let pronouns = userPronouns.pronouns
    let pronoun1 = userPronouns.pronoun1

    await sendMessage(app, 'GLFAEL1SL', 'New user <@' + userId + '> (' + pronouns + ') joined! Here\'s why ' + pronoun1 + ' joined the Hack Club community:\n\n' + text + '\n\nReact to this message to take ownership on reaching out.', 10)
  }

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

  async function startTutorial(e, user, restart) {
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
      users: 'U012FPRJEVB' //Clippy Admin
    })
    await app.client.conversations.invite({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channelId,
      users: 'UH50T81A6' //banker
    })

    const somOptions = {
      maxRecords: 1,
      filterByFormula: `Email = '${e.user.profile.email}'`,
      authKey: process.env.AIRTABLE_API_KEY
    }
    let somData = await axios(`https://api2.hackclub.com/v0.1/Pre-register/Applications?select=${JSON.stringify(somOptions)}`).then(r => r.data)

    if (defaultFilter(e)) {
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
            'Has previously completed tutorial': false,
            'Pushed first button': false,
            'Flow': 'Default'
          })
        }
        await islandTable.update(record.id, {
          'Island Channel ID': channelId,
          'Island Channel Name': islandName.channel,
          'Has completed tutorial': true,
          'Pushed first button': false,
          'Flow': 'Default'
        })
      } else {
        await islandTable.create({
          'Name': user,
          'Island Channel ID': channelId,
          'Island Channel Name': islandName.channel,
          'Has completed tutorial': false,
          'Has previously completed tutorial': false,
          'Pushed first button': false,
          'Flow': somData[0] === null ? 'Default' : 'Summer of Making'
        })
      }

      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `Hi, I'm Clippy! My job is to help you join the Hack Club community. Do you need assistance?`
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
                  "text": ":star2:What??? What's this?"
                },
                "action_id": "intro_progress_1"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "emoji": true,
                  "text": ":money_with_wings:Of course I want free stuff!"
                },
                "action_id": "intro_progress_2"
              },
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "emoji": true,
                  "text": ":eye:Wait what?"
                },
                "action_id": "intro_progress_3"
              }
            ]
          }
        ]
      })

      await timeout(30000)
      let pushedButton = await hasPushedButton(user)
      if (!pushedButton) {
        await sendMessage(app, channelId, `(<@${user}> Psst—every new member completes this quick intro to unlock the Hack Club community. It only takes 1 minute—I promise—and you get free stuff along the way. Click any of the three buttons above to begin :star2: :money_with_wings: :eye:)`, 10)
      }
    }
  }
}

exports.loadFlow = loadFlow