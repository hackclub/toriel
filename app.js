const { App } = require("@slack/bolt")

const app = new App({
  signingSecret: "process.env.SLACK_SIGNING_SECRET",
  token: "process.env.SLACK_BOT_TOKEN"
});

// Load all files in the "/flows" folder
const normalizedPath = require("path").join(__dirname, "flows");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./flows/" + file).loadFlow(app);
});

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
