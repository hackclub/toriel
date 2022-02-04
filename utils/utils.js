const AirtablePlus = require("airtable-plus");
const friendlyWords = require("friendly-words");
const pluralize = require("pluralize");
const fetch = require("node-fetch");
const FormData = require("form-data");
const GithubSlugger = require("github-slugger");
const slugger = new GithubSlugger();
const axios = require("axios");

const { defaultIntro, jankathonIntro } = require("./intros");

const islandTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: "appYGt7P3MtotTotg",
  tableName: "Tutorial Island",
});

exports.islandTable = islandTable;

const eventsTable = new AirtablePlus({
  apiKey: process.env.AIRTABLE_API_KEY,
  baseID: "appezi7TOQFt8vTfa",
  tableName: "Events",
});
exports.eventsTable = eventsTable;

const startTutorial = async (app, user, flow, restart) => {
  flow = "Default";
  const islandName = await generateIslandName();
  const newChannel = await app.client.conversations.create({
    token: process.env.SLACK_BOT_TOKEN,
    name: islandName.channel,
    is_private: true,
    user_ids: process.env.BOT_USER_ID,
  });
  const channelId = newChannel.channel.id;
  let userProfile = await app.client.users.info({
    token: process.env.SLACK_BOT_TOKEN,
    user: user,
  });

  const airtableQueryOptions = {
    maxRecords: 1,
    filterByFormula: `{Email Address} = '${userProfile.user.profile.email}'`,
  };

  let joinData = await axios(
    `https://api2.hackclub.com/v0.1/Joins/Join%20Requests?authKey=${
      process.env.AIRTABLE_API_KEY
    }&select=${JSON.stringify(airtableQueryOptions)}&meta=true`
  ).then((r) => r.data);

  if (joinData["response"].length > 0) {
    if (joinData["response"][0]["fields"]["Reason"] == "Jankathon") {
      console.log("hi!");
      flow = "Jankathon";
    }
  }

  if (restart) {
    let record = await getUserRecord(user);
    if (typeof record === "undefined") {
      record = await islandTable.create({
        Name: user,
        "Island Channel ID": channelId,
        "Island Channel Name": islandName.channel,
        "Has completed tutorial": false,
        "Has previously completed tutorial": false,
        "Pushed first button": false,
        Flow: flow,
      });
    }
    await islandTable.update(record.id, {
      "Island Channel ID": channelId,
      "Island Channel Name": islandName.channel,
      "Has completed tutorial": true,
      "Pushed first button": false,
      Flow: flow,
    });
  } else {
    await islandTable.create({
      Name: user,
      "Island Channel ID": channelId,
      "Island Channel Name": islandName.channel,
      "Has completed tutorial": false,
      "Has previously completed tutorial": false,
      "Pushed first button": false,
      Flow: flow,
    });
  }
  console.log(`New tutorial channel created: ${channelId}`);

  await app.client.conversations
    .invite({
      token: process.env.SLACK_BOT_TOKEN,
      channel: channelId,
      users: user,
    })
    .catch((err) => console.log(err.data.errors));
  await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    users: "U012FPRJEVB", //Clippy Admin
  });
  /*await app.client.conversations.invite({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    users: 'UH50T81A6' //banker
  })*/

  await app.client.conversations.setTopic({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    topic: `Welcome to Hack Club! :wave: Unlock the community by completing this tutorial.`,
  });

  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
    blocks: flow == "Default" ? defaultIntro : jankathonIntro,
  });

  await timeout(30000);
  let pushedButton = await hasPushedButton(user);
  if (!pushedButton) {
    await sendMessage(
      app,
      channelId,
      `(<@${user}> I promise, there are good chats going on here; you just need to complete a quick intro so you can get the most out of Hack Club! It'll only take 1 minute.)`,
      10
    );
  }
};
exports.startTutorial = startTutorial;

const sendToWelcomeCommittee = async (app, userId, text, summer) => {
  let userPronouns = await getPronouns(userId);
  let pronouns = userPronouns.pronouns;
  let pronoun1 = userPronouns.pronoun1;

  if (summer) {
    await sendCustomizedMessage(
      app,
      "GLFAEL1SL",
      "<@" +
        userId +
        "> (" +
        pronouns +
        ") was just promoted to a full member! Here's why " +
        pronoun1 +
        " joined the Hack Club community:\n\n" +
        text +
        "\n\nReact to this message to take ownership on reaching out.",
      "https://cloud-kow60jksb.vercel.app/imageedit_3_4872718040.jpg",
      "Summer Clippy",
      10
    );
  } else {
    await sendMessage(
      app,
      "GLFAEL1SL",
      "<@" +
        userId +
        "> (" +
        pronouns +
        ") just joined Hack Club! Here's why " +
        pronoun1 +
        " joined the community:\n\n" +
        text +
        "\n\nReact to this message to take ownership on reaching out.",
      10
    );
  }
};
exports.sendToWelcomeCommittee = sendToWelcomeCommittee;

const sendMessage = async (app, channel, text, delay, ts, unfurl) => {
  await timeout(delay || 1500);
  const msg = await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel,
    text,
    thread_ts: null || ts,
    unfurl_links: unfurl || false,
  });
  return msg;
};
exports.sendMessage = sendMessage;

const sendCustomizedMessage = async (
  app,
  channel,
  text,
  icon_url,
  username,
  delay,
  ts,
  unfurl
) => {
  await timeout(delay || 3000);
  return await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel,
    text,
    icon_url,
    username,
    thread_ts: null || ts,
    unfurl_links: unfurl || false,
  });
};
exports.sendCustomizedMessage = sendCustomizedMessage;

const sendEphemeralMessage = async (app, channel, text, user) => {
  return await app.client.chat.postEphemeral({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    text: text,
    user: user,
  });
};
exports.sendEphemeralMessage = sendEphemeralMessage;

const getIslandId = async (userId) => {
  let record = await getUserRecord(userId);
  if (typeof record === "undefined") return null;
  return record.fields["Island Channel ID"];
};
exports.getIslandId = getIslandId;

const getLatestMessages = async (app, channelId) => {
  const history = await app.client.conversations.history({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channelId,
  });
  const botHistory = history.messages.filter(
    (message) => message.user === process.env.BOT_USER_ID
  );
  const lastBotMessage = botHistory[0].text;
  const lastUserMessage = history.messages[0].text;

  return {
    lastBotMessage: lastBotMessage,
    lastUserMessage: lastUserMessage,
    latestReply: botHistory[0].latest_reply,
    latestTs: botHistory[0].ts,
  };
};
exports.getLatestMessages = getLatestMessages;

const sendSingleBlockMessage = async (
  app,
  channel,
  text,
  blockText,
  actionId,
  delay
) => {
  await timeout(delay || 3000);
  let message = await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: blockText,
              emoji: true,
            },
            action_id: actionId,
          },
        ],
      },
    ],
  });
  return message;
};
exports.sendSingleBlockMessage = sendSingleBlockMessage;

const updateSingleBlockMessage = async (
  app,
  ts,
  channel,
  text,
  blockText,
  actionId
) => {
  await app.client.chat.update({
    token: process.env.SLACK_BOT_TOKEN,
    ts: ts,
    channel: channel,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: blockText,
              emoji: true,
            },
            action_id: actionId,
          },
        ],
      },
    ],
  });
};
exports.updateSingleBlockMessage = updateSingleBlockMessage;

const sendDoubleBlockMessage = async (
  app,
  channel,
  text,
  blockText1,
  blockText2,
  actionId1,
  actionId2
) => {
  await timeout(3000);
  await app.client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: channel,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: blockText1,
            },
            style: "primary",
            action_id: actionId1,
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: blockText2,
            },
            style: "danger",
            action_id: actionId2,
          },
        ],
      },
    ],
  });
};
exports.sendDoubleBlockMessage = sendDoubleBlockMessage;

const updateInteractiveMessage = async (app, ts, channel, message) => {
  await app.client.chat.update({
    token: process.env.SLACK_BOT_TOKEN,
    ts: ts,
    channel: channel,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ],
    text: "Message from Test App",
  });
};
exports.updateInteractiveMessage = updateInteractiveMessage;

const inviteUserToChannel = async (app, user, channel, doAsAdmin = false) => {
  const token = doAsAdmin
    ? process.env.SLACK_OAUTH_TOKEN
    : process.env.SLACK_BOT_TOKEN;

  await app.client.conversations
    .invite({
      token: token,
      channel: channel,
      users: user,
    })
    .catch((err) => {
      if (err.data.error === "already_in_channel") {
        console.log(`${user} is already in ${channel}—skipping this step...`);
      }
    });
};
exports.inviteUserToChannel = inviteUserToChannel;

const setPronouns = async (app, userId, pronouns, pronoun1) => {
  let record = await getUserRecord(userId);
  let recId = record.id;

  await islandTable.update(recId, {
    Pronouns: pronouns,
    "Pronoun 1": pronoun1,
  });
  try {
    app.client.users.profile.set({
      token: process.env.SLACK_OAUTH_TOKEN,
      profile: { pronouns, XfD4V9MG3V: pronouns },
      user: userId,
    });
  } catch {
    console.log(
      `Could not update pronouns for ${userId} because they are a Slack admin`
    );
  }
};
exports.setPronouns = setPronouns;

const setRegion = async (app, userId, region) => {
  let record = await getUserRecord(userId);
  let recId = record.id;

  await islandTable.update(recId, {
    "Regional Flow": region,
  });
};
exports.setRegion = setRegion;

const setHS = async (app, userId, hs) => {
  let record = await getUserRecord(userId);
  let recId = record.id;

  return await islandTable.update(recId, {
    "High School": hs,
  });
};
exports.setHS = setHS;

const getPronouns = async (userId) => {
  let userRecord = await getUserRecord(userId);
  let pronouns = userRecord.fields["Pronouns"];
  let pronoun1 = userRecord.fields["Pronoun 1"];
  return {
    pronouns: pronouns,
    pronoun1: pronoun1,
  };
};
exports.getPronouns = getPronouns;

const setWhereFrom = async (app, userId, whereFrom, whereFrom1) => {
  let record = await getUserRecord(userId);
  let recId = record.id;

  await islandTable.update(recId, {
    whereFrom: whereFrom,
    whereFrom1: whereFrom1,
  });
  try {
    app.client.users.profile.set({
      token: process.env.SLACK_OAUTH_TOKEN,
      profile: { XfD4V9MG3V: whereFrom },
      user: userId,
    });
  } catch {
    console.log(
      `Could not update where from for ${userId} because they are a Slack admin`
    );
  }
};
exports.setWhereFrom = setWhereFrom;

const getWhereFrom = async (userId) => {
  let userRecord = await getUserRecord(userId);
  let whereFrom = userRecord.fields["whereFrom"];
  let whereFrom1 = userRecord.fields["whereFrom1"];
  return {
    whereFrom: whereFrom,
    whereFrom1: whereFrom1,
  };
};
exports.getWhereFrom = getWhereFrom;

const hasPreviouslyCompletedTutorial = async (userId) => {
  let userRecord = await getUserRecord(userId);
  let completed = userRecord.fields["Has previously completed tutorial"];
  return completed;
};
exports.hasPreviouslyCompletedTutorial = hasPreviouslyCompletedTutorial;

const setPreviouslyCompletedTutorial = async (userId) => {
  let userRecord = await getUserRecord(userId);
  let recId = userRecord.id;

  islandTable.update(recId, {
    "Has previously completed tutorial": true,
  });
};
exports.setPreviouslyCompletedTutorial = setPreviouslyCompletedTutorial;

const setFlow = async (userId, flow) => {
  let userRecord = await getUserRecord(userId);
  await islandTable.update(userRecord.id, {
    Flow: flow,
  });
};
exports.setFlow = setFlow;

const updatePushedButton = async (userId) => {
  let record = await getUserRecord(userId);
  let recId = record.id;

  islandTable.update(recId, {
    "Pushed first button": true,
  });
};
exports.updatePushedButton = updatePushedButton;

const getIslandName = async (userId) => {
  let record = await getUserRecord(userId);
  return record.fields["Island Channel Name"];
};
exports.getIslandName = getIslandName;

const hasPushedButton = async (userId) => {
  let record = await getUserRecord(userId);
  if (typeof record === "undefined") return true;
  return record.fields["Pushed first button"];
};
exports.hasPushedButton = hasPushedButton;

const hasCompletedTutorial = async (userId) => {
  let record = await getUserRecord(userId);
  if (typeof record === "undefined") return true;
  return (
    record.fields["Has completed tutorial"] || record.fields["Club leader"]
  );
};
exports.hasCompletedTutorial = hasCompletedTutorial;

const isBot = async (app, userId) => {
  const user = await app.client.users.info({
    token: process.env.SLACK_OAUTH_TOKEN,
    user: userId,
  });
  return user.user.is_bot;
};
exports.isBot = isBot;

const getUserRecord = async (userId) => {
  try {
    let record = (
      await islandTable.read({
        filterByFormula: `{Name} = '${userId}'`,
        maxRecords: 1,
      })
    )[0];
    return record;
  } catch {}
};
exports.getUserRecord = getUserRecord;

const checkIslandNameTaken = async (islandName) => {
  let record = (
    await islandTable.read({
      filterByFormula: `{Island Channel Name} = '${islandName}'`,
      maxRecords: 1,
    })
  )[0];
  return record !== undefined;
};
exports.checkIslandNameTaken = checkIslandNameTaken;

const getNextEvent = async () => {
  try {
    let record = (
      await eventsTable.read({
        view: "Future Events",
        maxRecords: 1,
      })
    )[0];

    let eventUrl = `https://events.hackclub.com/${slugger.slug(
      record.fields["Title"]
    )}`;

    return {
      name: record.fields["Title"],
      day: record.fields["Date (formatted)"],
      time: record.fields["Time (formatted)"],
      url: eventUrl,
    };
  } catch {
    return null;
  }
};
exports.getNextEvent = getNextEvent;

// couple important things to note here:
//
// current channel names look like "4-lyres-tutorial"
//
// it's important that channel names start with a number, so the tutorial
// channel shows up at the top of the channel list for new users.
//
// right now, with the current friendly-words list from glitch, there are 4728
// possible words. there are 8 numbers between 2 and 9 (inclusive of 2 and 9),
// meaning that there are 37824 total possible combinations of channel + number
// combinations.
//
// i am purposely trying to keep channel names as short as possible without
// confusion, which is why a method that generates less permutations was
// chosen. this will have to be adjusted in the future when hack club gets tens
// of thousands more students on the slack.
const generateIslandName = async () => {
  const { objects, predicates, teams, collections } = friendlyWords;
  const words = [...objects, ...predicates, ...teams, ...collections];

  // random number between 2 and 9
  const randomNum = Math.floor(Math.random() * 8) + 2;
  const randomWord = words[Math.floor(Math.random() * words.length)];

  // "tendencys" -> "tendencies"
  const pluralizedWord = pluralize(randomWord, randomNum);

  // start channel name with a number so it shows at the top of the slack list
  const channel = `${randomNum}-${pluralizedWord}-tutorial`;
  const pretty = `${randomNum} ${capitalizeFirstLetter(
    pluralizedWord
  )} Tutorial`;

  const taken = await checkIslandNameTaken(channel);
  if (taken) return generateIslandName();

  return {
    channel: channel,
    pretty: pretty,
  };
};
exports.generateIslandName = generateIslandName;

const promoteUser = async (user) => {
  const form2 = new FormData();
  form2.append("user", user);
  form2.append("token", process.env.SLACK_INVITE_TOKEN);
  let userProfile = await (
    await fetch("https://slack.com/api/users.info", {
      body: form2,
      method: "POST",
    })
  ).json();

  if (userProfile.user.is_restricted || userProfile.user.is_ultra_restricted) {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("user", user);
      form.append("token", process.env.SLACK_INVITE_TOKEN);
      fetch(
        "https://slack.com/api/users.admin.setRegular?slack_route=T0266FRGM",
        {
          method: "POST",
          body: form,
        }
      )
        .then((res) => {
          console.log(res);
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  } else {
    console.log(`User ${user} is already promoted, no need to promote again`);
    return;
  }
};
exports.promoteUser = promoteUser;

const completeTutorial = async (userId) => {
  let record = await getUserRecord(userId);
  await islandTable.update(record.id, {
    "Has completed tutorial": true,
  });
};
exports.completeTutorial = completeTutorial;

const messageIsPartOfTutorial = (body, correctChannel) => {
  return (
    body.event.subtype !== "channel_join" &&
    body.event.user !== "U012CUN4U1X" &&
    body.event.channel === correctChannel
  );
};
exports.messageIsPartOfTutorial = messageIsPartOfTutorial;

const capitalizeFirstLetter = (str) => {
  return str[0].toUpperCase() + str.slice(1);
};
exports.capitalizeFirstLetter = capitalizeFirstLetter;

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.timeout = timeout;
