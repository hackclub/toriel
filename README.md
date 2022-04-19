# Toriel

_Just a lil' ol greeter bot to direct new members joining the Hack Club Slack. You wonder what she might say..._

![Toriel DMing you about how to change Slack themes](https://cloud-nk3pf3qvy-hack-club-bot.vercel.app/2screen_shot_2022-04-07_at_11.06.08.png)

_Toriel is a fork of [Clippy](https://github.com/hackclub/clippy)._

## Running locally

Contributions are encouraged and welcome!

In order to run Toriel locally, you'll need to [join the Hack Club Slack](https://hackclub.com/slack). From there, ask @msw to be added to the Toriel app on Slack.

1. Clone this repository
    `git clone https://github.com/hackclub/toriel && cd toriel`
2. Install [ngrok](https://dashboard.ngrok.com/get-started/setup) (if you haven't already)
3. Install dependencies
    `npm install`
4. Create `.env` file
    - `touch .env`
    - Send a message mentioning `@creds` in [Hack Club's Slack](https://hackclub.com/slack/) asking for the `.env` file
5. Start server
    `npm run dev`
6. Forward your local server to ngrok
    `ngrok http 3000`
7. Update the settings in the [manifest.yml](https://github.com/hackclub/toriel/blob/main/manifest.yml)
    - Change the slash command and event endpoints by replacing `https://toriel.hackclub.com` with your ngrok URL
       - You can find your ngrok URL in the terminal where you ran `ngrok http 3000`. It would look similar to this (your ngrok URL will be different):
       ![Screenshot of ngrok running](https://cloud-mt3q3pxrm-hack-club-bot.vercel.app/0ngrok.png)
       - Take this URL and replace it with all `https://toriel.hackclub.com/slack/events` URLs (line [14](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L14), [18](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L18), [39](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L39), and [46](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L46). Include  `/slack/events` so your new URLs would be `your-ngrok-URL/slack/events`.
    - Change the app and bot name from `TORIEL` to something that doesn't start with `T` (ex. `msw-dev-toriel`). This prevents Slack's auto-suggestions from confusing new users.
    ![Screenshot of where to change name](https://cloud-mrhdyhr0u-hack-club-bot.vercel.app/0name.png)
    - Change the slash commands from `/toriel-COMMAND` to something that doesn't start with `t` (ex. `/toriel-restart` -> `/msw-dev-restart`).
    ![Screenshot of the location of slash command](https://cloud-hmei7opsz-hack-club-bot.vercel.app/0slash.png)
8. Update slash commands
     - Go to [index.js](index.js) and find the following line
         ![Screenshot of /toriel-restart and /toriel-call](https://cloud-ceuonqm0d-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_10.38.26_pm.png)
    - Change `/toriel-restart` and `/toriel-call` to your own slash commands like `msw-dev-restart`
9. Go to [api.slack.com](https://api.slack.com/apps?new_app=1) to create a new slack app
     - Select "from an [app manifest](https://api.slack.com/reference/manifests)"
     ![Screenshot of slack app options](https://cloud-kqknb2w6y-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_6.15.25_pm.png)
     When prompted, make sure you select the Hack Club Workspace (you might need to sign in).
     - Open the App Manifest tab in the sidebar
     ![Screenshot of where app manifest is](https://cloud-6w8u156gf-hack-club-bot.vercel.app/0bar.png)
     - Copy and paste your edited [manifest.yml](manifest.yml) into the manifest on the slack app. It should look something like this:
     ![Screenshot of the app manifest](https://cloud-1vgwo5g1o-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_6.40.00_pm.png)

10. Edit the env variables in [.env](.env) file.   
     ```
     SLACK_SIGNING_SECRET=SIGNING_SECRET
     SLACK_BOT_TOKEN=Bot_User_OAuth_Token
     ```
     where `SIGNING_SECRET` is your app's Signing Secret which you can find by clicking on "Basic Information" in the settings bar and scrolling down (click show to and copy it)
         ![Screenshot of where to click show and copy the signing secret](https://cloud-j9zzknpea-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_6.49.53_pm.png)
     and `Bot_User_OAuth_Token` is found under "OAuth & Permissions" (You will need click "Install to Workspace" before you can view the token)
     ![Screenshot of where the token is](https://cloud-twxncowk1-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_7.00.44_pm.png)
11. [Create a private channel](https://slack.com/help/articles/201402297-Create-a-channel) where your app can run the welcome flow. Similar to the role that #in-the-cave plays for Toriel (run `toriel-restart` in slack to see what this means).
     - Invite your bot to that channel (you can @mention it to add)
12. Edit [transcript.yml](/util/transcript.yml)
     - The key:value pairs under `channels:` represent `channel-name:channel-id` and these are referred to elsewhere in the codebase with `{channels.channel-name}`
     ![Screenshot of channel list](https://cloud-5prq93r05-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_9.12.10_pm.png)
     - You can get the channel id by opening the channel and clicking on the channel name in the top left. Scroll down the modal and you should see it (it's in the bottom left)
     - Hence, you should add your own bot to these channels **or** you can delete channels you can comment out channels you don't need for now with `#` and just add your bot to channels you do want it to join. 
     - Also, you want to add your own private channel here. ex. if your channel is `msw-test-cave` with the channel id `CDF1A5EG865` you would add 
       ```
       msw-test-cave: CDF1A5EG865
       ```
       > IMPORTANT: you might need access to these channels later on ex. to add a [new user to channels](/util/invite-user.js) which means not giving your bot access now could break the app.
13. Replace all `channels.cave` with `channels.name-of-your-private-channel` 
     - As `{channels.cave}` refers to `#in-the-cave`, we need to replace it with the private channel (ex. `{channels.msw-test-cave}`) that you created for your bot
14. Run `npm run dev` again and also reinstall your app to the workspace (under Basic Information)
     ![Screenshot of reinstall your app page](https://cloud-8uduk6deq-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_9.38.48_pm.png)

If you run into an error, read the message and it says `Toriel is not invited to these channels:` or `channel_not_found` just invite your bot to that channel (you can check the channel with its id by referring back to transcript.yml). If that channel is private, you can create a new private channel as its substitute but remember to change the references too. Ex. `#toriels-diary` is a private channel so you can create `#msw-toriels-diary`, add it to [transcript.yml](/util/transcript.yml), and change all `{channels.toriels-diary}` to `{channels.msw-toriels-diary}`.    

> note: you have to reupdate the ngrok URL on the slack app manifest and verify the URL each time to restart the server (the ngrok URL changes)

**Formatting** is important, please run `npm run fmt` on contribution.
