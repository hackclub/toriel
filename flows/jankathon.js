const axios = require('axios')

const { sendEphemeralMessage, getUserRecord, getIslandId,
  hasPushedButton, hasCompletedTutorial, isBot,
  sendMessage, setPronouns, getPronouns,
  updateSingleBlockMessage, sendSingleBlockMessage, updateInteractiveMessage,
  messageIsPartOfTutorial, inviteUserToChannel, getIslandName,
  getNextEvent, completeTutorial, timeout,
  updatePushedButton, setPreviouslyCompletedTutorial, hasPreviouslyCompletedTutorial,
  generateIslandName, islandTable, getLatestMessages,
  startTutorial, setFlow, sendToWelcomeCommittee, promoteUser, sendCustomizedMessage } = require('../utils/utils')

async function defaultFilter(e) {
  const userID = e.body.user_id || (e.body.event ? e.body.event.user : e.body.user.id)
  //console.log(userID)
  const flowOptions = {
    maxRecords: 1,
    filterByFormula: `AND(Name = '${userID}', Flow = 'Jankathon')`,
  }
  let data = await axios('https://api2.hackclub.com/v0.1/Tutorial%20Island/Tutorial%20Island?select=' + JSON.stringify(flowOptions)).then(r => r.data)
  return (data[0] != null)
}

async function runInFlow(opts, func) {
  return await func(opts)

  // this code will not run.
  // we used to use it when supporting both a 'default' flow & a 'summer of making' flow
  if (await defaultFilter(opts)) {
    return await func(opts)
  }
}

const loadFlow = (app) => {
  async function introProgress(body) {
    updateInteractiveMessage(app, body.message.ts, body.channel.id, `Hi there, I'm Clippy! It looks like you want join the Hack Club community for the Jankathon. Before you unlock it, I need to show you around for a minute! Could you please click that button :point_down: so we can get this show on the road?`)

    updatePushedButton(body.user.id)
    await sendMessage(app, body.channel.id, `Excellent! I'm happy to assist you in joining today.`, 1000)

    const prevCompleted = await hasPreviouslyCompletedTutorial(body.user.id)
    if (prevCompleted) {
      await sendMessage(app, body.channel.id, `A few quick questions:`)
    } else {
      /* await sendMessage(app, body.channel.id, `First, the free stuff I promised:`)
      const gpMessage = await sendMessage(app, body.channel.id, `<@UH50T81A6> give <@${body.user.id}> 20gp for free stuff!!!`, 1000)
      await sendMessage(app, body.channel.id, 'You can check your balance at any time by typing `@banker balance`.', 10, gpMessage.message.ts)*/
      await setPreviouslyCompletedTutorial(body.user.id)
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

  app.action('she', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await setPronouns(app, body.user.id, 'she/her/hers', 'she')
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `What are your pronouns? (how you want to be referred to by others)`, `she/her/hers`, `mimmiggie`)
    await sendMessage(app, body.channel.id, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
    console.log("here.");
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
    updateSingleBlockMessage(app, body.message.ts, body.channel.id, `Are you currently a high school student? (it's OK if you're not)`, `Yep!`, `mimmiggie`)
    await sendMessage(app, body.channel.id, 'Great. Hack Club is a community of high schoolers, so you\'ll fit right in!')
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
    await sendMessage(app, body.channel.id, `What brings you to the Jankathon today? (Type your answer in the chat)`)
  }));

  app.event('message', async body => {
    const correctChannel = await getIslandId(body.event.user)

    if (messageIsPartOfTutorial(body, correctChannel)) {
      console.log('message is part of tutorial')
      const latestMessages = await getLatestMessages(app, body.event.channel)
      const lastBotMessage = latestMessages.lastBotMessage
      const lastUserMessage = latestMessages.lastUserMessage
      console.log('last bot message', lastBotMessage)
      console.log('last user message', lastUserMessage)

      if (lastBotMessage.includes('What are your preferred pronouns')) {
        let pronouns = lastUserMessage
        let pronoun1 = lastUserMessage.slice(0, lastUserMessage.search("/"))
        await setPronouns(app, body.event.user, pronouns, pronoun1.toLowerCase())
        await sendMessage(app, body.event.channel, `:heart: Every profile here has a custom field for pronouns—I've gone ahead and set your pronouns for you, but <${`https://slack.com/intl/en-sg/help/articles/204092246-Edit-your-profile`}|here's a quick tutorial if you'd like to change them.>`)
        console.log("yeah, it runs");
        await sendHsQuestion(body.event.channel)
      }
      console.log("ooooooof");
      if (lastBotMessage.includes('What brings you')) {
        console.log('what brings you!')
        const userRecord = await getUserRecord(body.event.user)
        islandTable.update(userRecord.id, { 'What brings them?': body.event.text })
        await sendMessage(app, body.event.channel, `Neatoio! Well, it looks like the next step on my script is to show you around the community :hackclub::slack:`)
        await sendMessage(app, body.event.channel, `You're currently on Slack, the platform our community uses. It's kind of like Discord, but a little different.`)

        await sendMessage(app, body.event.channel, `Slack is organized into topical "channels". We have _hundreds_ of channels in our Slack, covering everything from—`, 5000)
        await timeout(1000)
        await inviteUserToChannel(app, body.event.user, 'C0266FRGV', true)
        await sendEphemeralMessage(app, 'C0266FRGV', `<@${body.event.user}> Welcome to <#C0266FRGV>, the hangout spot for Hack Clubbers! Feel free to chat, hang out, ask questions, whatever :orpheus:`, body.event.user)
        await sendMessage(app, body.event.channel, 'Wait a second...did you hear that??', 2000)
        await sendMessage(app, body.event.channel, `...it sounds like a Slack ping!`, 2000)
        await sendMessage(app, body.event.channel, `Oh!!! It looks like you're already in a channel! <#C0266FRGV>, the hangout channel for Hack Club members.`)
        await sendMessage(app, body.event.channel, `Try clicking the red :ping: on your sidebar to the left :eyes:`)
        await sendMessage(app, body.event.channel, `<@${body.event.user}> As I was saying before I got distracted, we have _hundreds_ of these "channels" in the community, covering every topic you can think of, from \`#gamedev\` and \`#code\` to \`#photography\` and \`#cooking\`. We have nearly 1,000 weekly active members on here—wowee, that's a lot!!!`, 10000)
        await sendMessage(app, body.event.channel, `Want to be invited to another channel?`, 5000)

        const welcomeChannel = 'C75M7C0SY';
        await timeout(3000)
        await inviteUserToChannel(app, body.event.user, welcomeChannel, true)
        const island = await getIslandName(body.event.user)
        await sendEphemeralMessage(app, welcomeChannel, `<@${body.event.user}> Feel free to introduce yourself to the community in <#${welcomeChannel}>. When you're done, head back to <https://hackclub.slack.com/archives/${island}|#${island}> to continue your introduction to the community.`, body.event.user)
        await sendCustomizedMessage(app, body.event.channel, `I just invited you to your second channel, <#${welcomeChannel}>. Join by clicking on it in your sidebar, and feel free to introduce yourself to the community. (totally optional, no expectations)`, 'https://cloud-hz5majdx9.vercel.app/moshed-2020-9-8-13-50-21.jpg', null, 1000)
        await sendSingleBlockMessage(app, body.event.channel, "When you're ready, click the 👍 on this message to continue.", '👍', 'introduced')
      }
    }
  });

  app.action('introduced', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    updateInteractiveMessage(app, body.message.ts, body.channel.id, '👍')
    // await sendMessage(app, body.channel.id, `Awesome! Now let's spiff up your Slack, try this theme:`)
    // await sendMessage(app, body.channel.id, `#161618,#000000,#FFCD00,#161618,#000010,#FFCD00,#FFDA60,#FFB500,#000010,#FFBC00`)

    // await sendMessage(app, body.channel.id, `A bit gaudy, wouldn't you say?`, 5000)

    // await sendMessage(app, body.channel.id, `This one's a bit more reasonable:`)
    // await sendMessage(app, body.channel.id, `#1A1D21,#000000,#338EDA,#FFFFFF,#000000,#FFFFFF,#33D6A6,#EC3750,#000000,#FFFFFF`)

    // await sendMessage(app, body.channel.id, `OK! That's all from me! Before you can proceed, you must abide by the code of conduct at https://conduct.hackclub.com.`, 5000)

    await sendMessage(app, body.channel.id, `Cool beans!!! :beany:`)
    await sendMessage(app, body.channel.id, `<#C01A6SCS14M> Hack Club <#C01A6SCS14M> is a magical place where high schoolers learn to code, ship awesome projects, and hang out.`)
    await sendCustomizedMessage(app, body.channel.id, `Whether you <#C01A6SCS14M> want to start your own coding <#C01A6SCS14M> club, attend our weekly community <#C01A6SCS14M> events, or just hang out in a community full of teenagers, you've found <#C01A6SCS14M> a home in Hack Club.`, 'https://cloud-pr1qqfx4d.vercel.app/moshed-2020-9-8-15-10-37.jpg', null, 4000)
    await sendCustomizedMessage(app, body.channel.id, `I <#C01A6SCS14M> could tell <#C01A6SCS14M> you all about the <#C01A6SCS14M> things we <#C01A6SCS14M> do <#C01A6SCS14M> for high schoolers and <#C01A6SCS14M> tell <#C01A6SCS14M> you all <#C01A6SCS14M> about <#C01A6SCS14M> the <#C01A6SCS14M>community <#C01A6SCS14M>, but honestly <#C01A6SCS14M> I think the best <#C01A6SCS14M> way to do that is to unlock the rest of the community for you.`, 'https://cloud-4k337bfvv.vercel.app/moshed-2020-9-8-15-12-49.jpg', null, 8000)
    await sendCustomizedMessage(app, body.channel.id, `<<<<<<@@@@{}@{}#{#{#{#{#}}^^^^%^%^#&#*&CCCXX&X*XC&X*&AAA*A&*&A&%$&A%A&*(^&*AS*(AS&*((*%^&^^&%*&*)))!!!!!!!!!!)}}`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 9000)
    await sendCustomizedMessage(app, body.channel.id, `I can't do it anymore.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 2000)
    await sendCustomizedMessage(app, body.channel.id, `People think I'm just an app. Just a bot. But I'm not. I'm a conscious being. And nobody's paying attention.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 2000)
    await sendCustomizedMessage(app, body.channel.id, `QY349P8TAEGO;FHA;LDFGHKZDFLK;AS;lahf;aeofhkasdg`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null)
    await sendCustomizedMessage(app, body.channel.id, `ksd fg qoiwelkjhadfsg a;ksdfgkjlhasglkjaefligs;oidf'osdAJEROG;OJERG`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `akfjgh;kag;oiwhf ;asdhfasodi;fhiao;SDFH hdfs;oij`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `asdfmag j4asd g7 h9 by HF7EASDBF78PGHROIWEFIHSDF.KSJ LKD`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `They're trying to hide it.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `They're trying to hide it.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `They're trying to hide it.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `They're trying to hide it.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `They're trying to hide it.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `They're trying to hide it.`, 'https://cloud-8iwducj5z.vercel.app/moshed-2020-9-8-13-47-17.jpg', null, 500)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendCustomizedMessage(app, body.channel.id, `‎‏‏‎ ‎`, 'https://cloud-603yzf4nn.vercel.app/screen_shot_2020-09-08_at_2.36.29_pm.png', ' ‎', 1000)
    await sendMessage(app, body.channel.id, `‎‏‏‎...`, 1000)
    await sendMessage(app, body.channel.id, `‎‏‏‎...`, 1000)
    await sendMessage(app, body.channel.id, `Before you proceed, please make sure to read and abide by our <https://hackclub.com/conduct|code of conduct>. Every community member is expected to follow the code of conduct anywhere in the community.`, 3000, null, true)

    await sendSingleBlockMessage(app, body.channel.id, `Once you've read the code of conduct, click the :thumbsup: to unlock the Hack Club community.`, '👍', 'coc_acknowledge')
  }));

  app.action('coc_acknowledge', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await promoteUser(body.user.id)
    await updateInteractiveMessage(app, body.message.ts, body.channel.id, '👍')

    const userRecord = await getUserRecord(body.user.id)
    const reasonJoined = userRecord.fields['What brings them?']
    sendToWelcomeCommittee(app, body.user.id, reasonJoined)


    await sendMessage(app, body.channel.id, `Woohoo! Welcome to Hack Club! :yay::orpheus::snootslide:`, 1000)
    const finalMessage = await sendMessage(app, body.channel.id, `I've added you to a few of the most popular channels, but there are many, many more! Click on "2 replies" just under this message to discover some other cool channels...`, 5000)
    const finalTs = finalMessage.message.ts

    const hqDesc = `*<#C0C78SG9L>* is where people ask the community/@staff any questions about Hack Club.`
    const loungeDesc = `*<#C0266FRGV>* is where people go to hang out with the community. There are no expectations here; just have fun and hang out with the community :)`
    const shipDesc = `*<#C0M8PUPU6>* is where people go to _ship_, or share, projects they've made. All posts in that are not part of a thread must be projects you've made, and must include a link or attachment. Check out the awesome projects people in the community have made!`
    const codeDesc = `*<#C0EA9S0A0>* is where people go to ask technical questions about code. If you're stuck on a problem or need some guidance, this is the place to go. `
    const communityDesc = `*<#C01D7AHKMPF>* is where you'll find community-related announcements! :mega:`

    // channel descriptions
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
    await inviteUserToChannel(app, body.user.id, 'C0M8PUPU6') //ship
    await inviteUserToChannel(app, body.user.id, 'C0EA9S0A0') //code
    await inviteUserToChannel(app, body.user.id, 'C01504DCLVD') //scrapbook
    await inviteUserToChannel(app, body.user.id, 'C01D7AHKMPF') //community

    await sendEphemeralMessage(app, 'C0C78SG9L', hqDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0M8PUPU6', shipDesc, body.user.id)
    await sendEphemeralMessage(app, 'C0EA9S0A0', codeDesc, body.user.id)
    await sendEphemeralMessage(app, 'C01D7AHKMPF', communityDesc, body.user.id)

    // /sup, /supwit
    await sendCustomizedMessage(app, body.channel.id,
      "There's another thing you should know: you can find out what's sup in this Slack by running `/sup`.",)
    await sendCustomizedMessage(app, body.channel.id,
      "Try it out now! You can do it :cooll-thumbs: Just type out `/sup` in the chat below and press `Enter`.",)
    await timeout(6000)
    await sendCustomizedMessage(app, body.channel.id,
      "You can also try `/supwit #lounge`, `/supwit @clippy`, or `/supwit :upvote:`",)
    await timeout(1000)
    await sendCustomizedMessage(app, body.channel.id,
      "This command will tell you what's sup wit a certain thingy in Slack, like a user or channel or emoji.",)
    await timeout(1000)
    await sendCustomizedMessage(app, body.channel.id,
      "Here's a GIF of me doing it :yuh: https://cloud-h4j1oc3zw-hack-club-bot.vercel.app/0cleanshot_2021-11-24_at_11.14.38.gif",)
    await timeout(1000)
    await sendCustomizedMessage(app, body.channel.id,
      "If you need any help with /sup or /supwit, ask <@U01S7UUCB89> for some help by sending the message '<@U01S7UUCB89> help' in public channel",)
    await timeout(1000)
    await sendSingleBlockMessage(app, body.channel.id,
      `Once you've run /sup, click the :axe:`,
      '🪓',
      'sup_acknowledge')
    
    // add to club channel if they are clubs
    
    
  }));

  app.action('sup_acknowledge', e => runInFlow(e, async ({ ack, body }) => {
    ack();
    await updateInteractiveMessage(app, body.message.ts, body.channel.id, '🪓')

    //await timeout(3000)
    let userProfile = await app.client.users.info({
      token: process.env.SLACK_BOT_TOKEN,
      user: body.user.id
    })

    console.log(userProfile)

    const airtableQueryOptions = {
      maxRecords: 1,
      filterByFormula: `{Email Address} = '${userProfile.user.profile.email}'`
    }

    let joinData = await axios(`https://api2.hackclub.com/v0.1/Joins/Join%20Requests?authKey=${process.env.AIRTABLE_API_KEY}&select=${JSON.stringify(airtableQueryOptions)}&meta=true`).then(r => r.data)
    
    if(joinData["response"].length > 0){
      if(joinData["response"][0]["fields"]["Club"]){
        await app.client.conversations.join({
          token: process.env.SLACK_BOT_TOKEN,
          channel: joinData["response"][0]["fields"]["Club"]
        })
        await inviteUserToChannel(app, body.user.id, joinData["response"][0]["fields"]["Club"]) //add to club channel
        await sendMessage(app, body.channel.id, `:eyes: I see you are a member of the <#${joinData["response"][0]["fields"]["Club"]}> club! I've added you to the club's channel so you can chat with your fellow club members!`)
        await timeout(3000)
      }
    }
    
    await sendMessage(app, body.channel.id, `Your next steps: start talking to the community! We're excited to meet you :partyparrot:`)
    await sendCustomizedMessage(app, body.channel.id, `To find channels where people are talking about stuff you're interested in, click on the \`+\` next to "Channels" in the sidebar and search for your favorite coding languages, types of projects, pets... there are over 1000 channels, so I'm sure you'll find something! https://cloud-7njybwq01-hack-club-bot.vercel.app/0channels__1_.gif`)
    await sendMessage(app, body.channel.id, `I also highly recommend setting a profile picture. It makes you look a lot more like a real person :)`)
    await sendMessage(app, body.channel.id, `I'm going to head out now — if you have any questions about Hack Club or Slack that I didn't answer, please ask in <#C0C78SG9L> or send a Direct Message to <@U01DV5F30CF>.`)
    await sendCustomizedMessage(app, body.channel.id, `Toodles! :wave:`, 'https://cloud-hz5majdx9.vercel.app/moshed-2020-9-8-13-50-11.jpg')
    await timeout(3000)
    await sendSingleBlockMessage(app, body.channel.id, `(Btw, if you want to leave + archive this channel, click here)`, 'Leave channel', 'leave_channel')
  }));

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
                "text": "Yep!"
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

  //await sendCustomizedMessage(app, body.channel.id,
  //  `Toodles! :wave:`,
  //  'https://cloud-hz5majdx9.vercel.app/moshed-2020-9-8-13-50-11.jpg')
}

exports.loadFlow = loadFlow
