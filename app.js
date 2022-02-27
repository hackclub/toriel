require("dotenv").config();
const { App, ExpressReceiver } = require("@slack/bolt");
const express = require("express");
const fetch = require("node-fetch");
const { bugsnag } = require("./utils/bugsnag");

bugsnag();

const {
  updateInteractiveMessage,
  sendSingleBlockMessage,
  startTutorial,
  setFlow,
  getUserRecord,
  inviteUserToChannel,
  sendMessage,
  getPronouns,
  sendToWelcomeCommittee,
} = require("./utils/utils");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Load all files in the "/flows" folder
const normalizedPath = require("path").join(__dirname, "flows");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function (file) {
    require("./flows/" + file).loadFlow(app);
  });

async function restart({ command, ack }) {
  await ack();
  if (command.text === "") {
    await setFlow(command.user_id, "Default");
    await startTutorial(app, command.user_id, "default", true, false);
  } else if (command.text === "som") {
    await setFlow(command.user_id, "Summer of Making");
    await startTutorial(app, command.user_id, "som", true, false);
  }
}

app.event("team_join", async (body) => {
  await startTutorial(app, body.event.user.id, "default");
});

app.command("/dev-restart", restart); // for dev app

app.command("/restart", restart); // for production app

app.command("/clippy-channel", async ({ command, ack, respond }) => {
  await ack();
  if (command.text === "") {
    await respond({
      text: `Usage: \`/clippy-channel @username\``,
      response_type: "ephemeral",
    });
  } else {
    const userId = command.text.split(" ")[0].split("|")[0].substring(2);
    const userRecord = await getUserRecord(userId);
    try {
      await respond({
        text: `<@${userId}>'s Clippy channel is \`${userRecord.fields["Island Channel Name"]}\`. \`https://app.slack.com/client/T0266FRGM/${userRecord.fields["Island Channel ID"]}\``,
        response_type: "ephemeral",
      });
    } catch {
      await respond({
        text: `I don't know, sorry mate.`,
        response_type: "ephemeral",
      });
    }
  }
});

app.event("message", async (body) => {
  const defaultAdds = [
    "C0C78SG9L",
    "C0EA9S0A0",
    "C0266FRGV",
    "C0M8PUPU6",
    "C75M7C0SY",
    "C01504DCLVD",
    "C01D7AHKMPF",
  ];
  if (
    (body.message.subtype === "channel_join" &&
      body.message.text === `<@${body.message.user}> has joined the channel` &&
      defaultAdds.includes(body.message.channel)) ||
    (body.message.channel === "C01A6SCS14M" &&
      body.message.user !== "U012H797734")
  ) {
    try {
      await app.client.chat.delete({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel: body.message.channel,
        ts: body.message.event_ts,
      });
    } catch (error) {
      console.log("Deleting messages has failed:");
      console.log(error);
    }
  }
});

app.event("member_joined_channel", async (body) => {
  if (body.event.channel === "C01A6SCS14M") {
    await app.client.conversations.kick({
      token: process.env.SLACK_OAUTH_TOKEN,
      channel: body.event.channel,
      user: body.event.user,
    });
  }
});

app.action("previously_pressed", async ({ ack, body }) => {
  ack();
});

// botInstance.action('leave_channel', replyWith() )
app.action("leave_channel", async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(
    app,
    body.message.ts,
    body.channel.id,
    `(Btw, if you want to leave + archive this channel, click here)`
  );
  await sendSingleBlockMessage(
    app,
    body.channel.id,
    `Are you sure? You won't be able to come back to this channel.`,
    `Yes, I'm sure`,
    "leave_confirm",
    10
  );
});

app.action("leave_confirm", async ({ ack, body }) => {
  ack();
  await updateInteractiveMessage(
    app,
    body.message.ts,
    body.channel.id,
    `Okay! Bye :wave:`
  );
  await app.client.conversations.archive({
    token: process.env.SLACK_OAUTH_TOKEN,
    channel: body.channel.id,
  });
});

app.action("promoted", async ({ ack, body }) => {
  ack();
  try {
    await updateInteractiveMessage(
      app,
      body.message.ts,
      body.channel.id,
      ":star2:"
    );
  } catch (error) {
    console.log("A fishy error I found: " + error);
  }
  await sendMessage(
    app,
    body.channel.id,
    `Woohoo! Welcome to Hack Club! :yay::orpheus::snootslide:`,
    1000
  );
  await sendMessage(
    app,
    body.channel.id,
    `I just invited you to the community's default channels. But click on this message to see a bunch of other cool channels you can join!`
  );
  await inviteUserToChannel(app, body.user.id, "C0C78SG9L"); //hq
  await inviteUserToChannel(app, body.user.id, "C0266FRGV"); //lounge
  await inviteUserToChannel(app, body.user.id, "C0M8PUPU6"); //ship
  await inviteUserToChannel(app, body.user.id, "C0EA9S0A0"); //code
  const userRecord = await getUserRecord(body.user.id);
  const reasonJoined = userRecord.fields["What brings them?"];
  sendToWelcomeCommittee(app, body.user.id, reasonJoined, true);
  const pronouns = await getPronouns(body.user.id);
  if (
    pronouns.pronouns === "they/them/theirs" ||
    pronouns.pronouns === "she/her/hers"
  ) {
    await sendMessage(
      app,
      body.channel.id,
      `By the way, I also recommend checking out <#CFZMXJ3FB>—it’s a channel for women/femme/non-binary people in Hack Club! :orpheus::sparkling_heart:`
    );
  }
});

// Orpheus POSTS to this endpoint with the user ID of the promoted user and the ID of the promoter
// args: promotedId, promoterId
receiver.app.use(express.json());
receiver.app.post("/promote", async (req, res) => {
  try {
    if (req.body.key != process.env.ORPHEUS_KEY)
      return res.status(403).send("Only Orpheus can make this request!");
    const userId = req.body.promotedId;
    const promoterId = req.body.promoterId;
    const userRecord = await getUserRecord(userId);
    const islandId = userRecord.fields["Island Channel ID"];
    sendSingleBlockMessage(
      app,
      islandId,
      `<@${userId}> :wave: Hey there! You've just been promoted to a full user by <@${promoterId}>. That means you have access to all of Hack Club's hundreds of channels instead of only the 4 you were added to.\n\nTo unlock the Hack Club community, click the :star2: below!`,
      ":star2:",
      "promoted"
    );
    res.status(200).end();
  } catch (error) {
    console.log("Promoting user failed:");
    console.log(error);
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Bolt app is running on port ${port}!`);
  let latestCommitMsg = "¯\\_(ツ)_/¯";
  await fetch("https://api.github.com/repos/hackclub/clippy/commits/main")
    .then((r) => r.json())
    .then((d) => (latestCommitMsg = d.commit.message));
  const message = `It looks like I'm alive again! Here's what I'm up to now: *${latestCommitMsg}*`;
  await sendMessage(app, "C0P5NE354", message, 10);
})();
