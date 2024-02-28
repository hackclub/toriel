# Toriel
> Toriel is currently undergoing a new revamp! You can view the stuff being worked on [here](https://docs.google.com/document/d/13AYCps0_hWMG6lolBcIg3xGiTOch2rk5uViSghfRzZE/edit?usp=sharing), and take part in #toriel-dev, if you're on the slack

_Just a lil' ol greeter bot to direct new members joining the Hack Club Slack. You wonder what she might say..._


_Toriel is a fork of [Clippy](https://github.com/hackclub/clippy)._

## Running locally

Contributions are encouraged and welcome!

In order to run Toriel locally, you'll need to [join the Hack Club Slack](https://hackclub.com/slack). From there, ask @creds to be added to the Toriel app on Slack.

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
     - Take this URL and replace it with all `https://toriel.hackclub.com/slack/events` URLs (the [first slash command url](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L14), [second slash command url](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L18), [event url](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L39), and [interactivity url](https://github.com/hackclub/toriel/blob/922eb46862a472bc36d90a45cdb804741ff60d2e/manifest.yml#L46). Include `/slack/events` so your new URLs would be `your-ngrok-URL/slack/events`.
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
   - On the next modal, replace the demo manifest with your edited [manifest.yml](manifest.yml)
     ![Screenshot of manifest modal](https://user-images.githubusercontent.com/621904/164060319-e79851ac-f29b-463e-a32b-9bc5968ce8db.png)
10. Click "Install to Workspace" under the "Basic Information" tab in the settings bar
    ![Screenshot of installing to workspace](https://user-images.githubusercontent.com/621904/164061251-2f7fc9ef-3c07-482d-83f7-86f5798d77ad.png)
11. Edit the env variables in [.env](.env) file.
    ```
    SLACK_SIGNING_SECRET=SIGNING_SECRET
    SLACK_BOT_TOKEN=Bot_User_OAuth_Token
    ```
    where `SIGNING_SECRET` is your app's Signing Secret, which you can find by clicking on "Basic Information" in the settings bar and scrolling down (click show to and copy it)
    ![Screenshot of where to click show and copy the signing secret](https://cloud-j9zzknpea-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_6.49.53_pm.png)
    and `Bot_User_OAuth_Token` is found under "OAuth & Permissions" (You will need click "Install to Workspace" before you can view the token)
    ![Screenshot of where the token is](https://cloud-twxncowk1-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_7.00.44_pm.png)
12. [Create a private channel](https://slack.com/help/articles/201402297-Create-a-channel) where your app can run the welcome flow. Similar to the role that #in-the-cave plays for Toriel (run `toriel-restart` in slack to see what this means).
    - Invite your bot to that channel (you can @mention it to add)
13. Edit [transcript.yml](/util/transcript.yml)

    - The key:value pairs under `channels:` represent `channel-name:channel-id` and these are referred to elsewhere in the codebase with `{channels.channel-name}`

    ![Screenshot of channel list](https://cloud-5prq93r05-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_9.12.10_pm.png)

    - You can add your own bot to these channels for testing **or** you can delete or comment out channels you don't need for testing

      > IMPORTANT: you might need access to these channels later on, like to add a [new user to channels](/util/invite-user.js), which means not giving your bot access now could break the app.

    - Add your own private channel to the channel list. For example, if your channel is `msw-test-cave` with the channel id `CDF1A5EG865`, you would add:
      ```
      msw-test-cave: CDF1A5EG865
      ```
    - You can find the channel ID by opening the channel and clicking on the channel name in the top left. Scroll down the modal and you should see it in the bottom left corner
      ![Screenshot of channel ID](https://user-images.githubusercontent.com/621904/164070484-d3d4f57a-546f-4d60-b800-7c052a3bcbcf.png)

14. Do a global find and replace in the codebase to update `channels.cave` to `channels.name-of-your-private-channel`
    - As `{channels.cave}` refers to `#in-the-cave`, we need to replace it with the private channel (ex. `{channels.msw-test-cave}`) that you created for your bot
15. Run `npm run dev` again and also reinstall your app to the workspace (under Basic Information)
    ![Screenshot of reinstall your app page](https://cloud-8uduk6deq-hack-club-bot.vercel.app/0screenshot_2022-04-18_at_9.38.48_pm.png)

If you run into an error where the message reads `Toriel is not invited to these channels` or `channel_not_found`, just invite your bot to that channel (you can check the channel with its ID by referring back to [transcript.yml](/util/transcript.yml). If the channel is private, you can create a new private channel as its substitute, but remember to update the references in the code. Ex. `#toriels-diary` is a private channel, so you can create `#msw-toriels-diary`, add it to [transcript.yml](/util/transcript.yml), and change all `{channels.toriels-diary}` to `{channels.msw-toriels-diary}`.

_Note: you have to re-update the ngrok URL on the Slack app manifest and verify the URL each time to restart the server, since the ngrok URL changes_

**Formatting** is important, please run `npm run fmt` on contribution.
