const axios = require('axios')

const { generateIslandName, getUserRecord, islandTable,
  sendMessage, timeout, hasPushedButton,
  updateInteractiveMessage, updatePushedButton, hasPreviouslyCompletedTutorial,
  setPreviouslyCompletedTutorial, getPronouns, setPronouns,
  updateSingleBlockMessage, getIslandId, messageIsPartOfTutorial,
  getLatestMessages, inviteUserToChannel, sendSingleBlockMessage,
  completeTutorial, sendEphemeralMessage, startTutorial } = require('../utils/utils')

async function somFilter(e) {
  const userID = e.body.user_id || (e.body.event ? e.body.event.user : e.body.user.id)
  //console.log(userID)
  const options = {
    maxRecords: 1,
    filterByFormula: `AND(Name = '${userID}', Flow = 'Summer of Making')`
  }
  let data = await axios('https://api2.hackclub.com/v0.1/Tutorial%20Island/Tutorial%20Island?select=' + JSON.stringify(options)).then(r => r.data)

  if (e.body.text === '') return true
  else return data[0] !== null
}

async function runInFlow(opts, func) {
  if (await somFilter(opts)) {
    return await func(opts)
  }
}

const loadFlow = app => {
  app.command('/hardware', e => runInFlow(e, async ({ command, ack, say }) => {
    await ack();
    console.log('got /hardware command from SOM user!')
  }))
  app.command('/restart', e => runInFlow(e, async ({ command, ack, say }) => {
    await ack();
    console.log('som')
    await startTutorial(app, command.user_id, 'som', true)
  }))

  app.action('intro_progress_1', e => runInFlow(e, async ({ ack, body }) => {
    ack();
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

  const introProgress = async body => {
    updateInteractiveMessage(app, body.message.ts, body.channel.id, `Hi, I'm Clippy! My job is to help you join the Hack Club community. Do you need assistance?`)
    updatePushedButton(body.user.id)
    await sendMessage(app, body.channel.id, '...', 1000)
    await sendMessage(app, body.channel.id, '...', 1000)
    await sendMessage(app, body.channel.id, `Excellent! I'm happy to assist you in joining the Summer of Making today.`, 1000)

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
    console.log('sldkfdlsk')
    await timeout(3000)
    console.log('skdlfalkdj')
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

  app.action('she', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'she/her/hers', 'she')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `she/her/hers`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    learnQuestion(body.channel.id)
  }));
  app.action('he', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'he/him/his', 'he')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `he/him/his`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    learnQuestion(body.channel.id)
  }));
  app.action('they', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'they/them/theirs', 'they')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `they/them/theirs`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    learnQuestion(body.channel.id)
  }));
  app.action('something_else', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `something else`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `What are your preferred pronouns? (Type your answer in chat)`)
  }));

  const learnQuestion = async channel => {
    await sendMessage(app, channel, `What do you want to learn during Summer of Making? (type your answer in the chat)`)
  }

  app.event('message', e => runInFlow(e, async body => {
    const correctChannel = await getIslandId(body.event.user)
    if (messageIsPartOfTutorial(body, correctChannel)) {
      const latestMessages = await getLatestMessages(app, body.event.channel)
      const lastBotMessage = latestMessages.lastBotMessage
      const lastUserMessage = latestMessages.lastUserMessage

      if (lastBotMessage.includes('What are your preferred pronouns?')) {
        let pronouns = lastUserMessage
        let pronoun1 = lastUserMessage.slice(0, lastUserMessage.search("/"))
        await setPronouns(app, body.event.user, pronouns, pronoun1.toLowerCase())
        await sendMessage(app, body.event.channel, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
        learnQuestion(body.event.channel)
      }

      if (lastBotMessage.includes('What do you want to learn')) {
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

        await sendMessage(app, body.event.channel, `Very interesting! We're super excited to have you here.`)
        await sendMessage(app, body.event.channel, `Summer of Making is all about making things and sharing your work. I just invited you to <#CCU43K0PK> and <#C0M8PUPU6> to help you get started.`)
        inviteUserToChannel(app, body.event.user, 'CCU43K0PK')
        inviteUserToChannel(app, body.event.user, 'C0M8PUPU6')
        await sendMessage(app, body.event.channel, `WIP stands for "work in progress"—if you share your work-in-progress projects in here, you'll get points!`)
        await sendMessage(app, body.event.channel, `<#C0M8PUPU6>ping a project means sharing or launching a project. #ship is where people share their completed projects.`)
        await sendMessage(app, body.event.channel, `But the Summer of Making isn't all there is to Hack Club. We have _hundreds_ of channels in our community, covering everything from <#C6LHL48G2> and <#C0EA9S0A0> to <#CBX54ACPJ> and <#C010SJJH1PT>. I'll show you a few of my favorites in a minute.`)
        await sendMessage(app, body.event.channel, `Before you go, though—I just invited you to <#C75M7C0SY>. I highly recommend introducing yourself to the community!`)
        inviteUserToChannel(app, body.event.user, 'C75M7C0SY')
        await sendMessage(app, body.event.channel, `One last thing: please make sure to read our <${`https://hackclub.com/conduct`}|code of conduct>. All community members are expected to follow the code of conduct.`, 5000, null, true)
        await sendSingleBlockMessage(app, body.event.channel, `Once you've read the code of conduct, click the 👍 to finish the tutorial.`, '👍', `coc_acknowledge`)
      }
    }
  }));

  async function sendToWelcomeCommittee(userId, text) {
    let userPronouns = await getPronouns(userId)
    let pronouns = userPronouns.pronouns
    let pronoun1 = userPronouns.pronoun1

    sendMessage(app, 'GLFAEL1SL', 'New Summer of Making participant <@' + userId + '> (' + pronouns + ') joined! Here\'s what ' + pronoun1 + ' wants to learn:\n\n' + text + '\n\nReact to this message to take ownership on reaching out.', 10)
  }

  app.action('coc_acknowledge', e => runInFlow(e, async ({ ack, body }) => {
    await ack();
    await updateInteractiveMessage(app, body.message.ts, body.channel.id, '👍')
    const postCocMessage = await sendMessage(app, body.channel.id, `That's all from me! I just invited you to Hack Club's default channels—but click on "6 replies" on this message to see a bunch of other awesome channels!`)
    const cocTs = postCocMessage.message.ts

    const hqDesc = `*<#C0C78SG9L>* is where people ask the community/@staff any questions about Hack Club.`
    const loungeDesc = `*<#C0266FRGV>* is where people go to hang out with the community. There are no expectations here; just have fun and hang out with the community :)`
    const shipDesc = `*<#C0M8PUPU6>* is where people go to _ship_, or share, projects they've made. All posts in that are not part of a thread must be projects you've made, and must include a link or attachment. Check out the awesome projects people in the community have made!`
    const codeDesc = `*<#C0EA9S0A0>* is where people go to ask technical questions about code. If you're stuck on a problem or need some guidance, this is the place to go. `

    await completeTutorial(body.user.id)

    await inviteUserToChannel(app, body.user.id, 'C0C78SG9L') //hq
    await inviteUserToChannel(app, body.user.id, 'C0266FRGV') //lounge
    //await inviteUserToChannel(app, body.user.id, 'C0M8PUPU6') //ship
    await inviteUserToChannel(app, body.user.id, 'C0EA9S0A0') //code

    await sendEphemeralMessage(app, 'C0C78SG9L', hqDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0266FRGV', loungeDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0M8PUPU6', shipDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0EA9S0A0', codeDesc, body.user.id)

    // channel descriptions
    await sendMessage(app, body.channel.id, hqDesc, 10, cocTs)
    await sendMessage(app, body.channel.id, loungeDesc, 10, cocTs)
    await sendMessage(app, body.channel.id, shipDesc, 10, cocTs)
    await sendMessage(app, body.channel.id, codeDesc, 10, cocTs)
    await sendMessage(app, body.channel.id, `Here are a bunch of other active channels that you may be interested in:`, 10, cocTs)
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
      cocTs
    );

    await sendMessage(app, body.channel.id, `I hope you have a fantastic time during the Hack Club Summer of Making! If you have any questions about the program or about Hack Club, send a message to <@USNPNJXNX>.`)
    await sendMessage(app, body.channel.id, `I'm going to head out now. Toodles! :wave:`)

    await timeout(3000)
    await sendSingleBlockMessage(app, body.channel.id, `(Btw, if you want to leave + archive this channel, click here)`, 'Leave channel', 'leave_channel')
  }));
}


exports.loadFlow = loadFlow