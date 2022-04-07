# Toriel

_Just a lil' ol greeter bot to direct new members joining the Hack Club Slack. You wonder what she might say..._

![Toriel DMing you about how to change Slack themes](https://cloud-nk3pf3qvy-hack-club-bot.vercel.app/2screen_shot_2022-04-07_at_11.06.08.png)

_Toriel is a fork of [Clippy](https://github.com/hackclub/clippy)._

## Running locally

Contributions are encouraged and welcome!

In order to run Toriel locally, you'll need to [join the Hack Club Slack](https://hackclub.com/slack). From there, ask @msw to be added to the Toriel app on Slack.

1. Clone this repository
    `git clone https://github.com/hackclub/clippy && cd clippy`
2. Install [ngrok](https://dashboard.ngrok.com/get-started/setup) (if you haven't already)
3. Install dependencies
    `npm install`
4. Create `.env` file
    - `touch .env`
    - Ask @msw for the `.env` file contents
5. Start server
    `npm run dev`
6. Forward your local server to ngrok
    `ngrok http 3000`
7. Update the Slack settings in the manifest.yml to use your ngrok URL

**Formatting** is important, please run `npm run fmt` on contribution.

<details>
  <summary>Working tasks</summary>

_This section is just from @MaxWofford– go ahead and ignore_

- [x] Setup messages in cave channel
    - image
    - text
    - audio
- [x] Ephemeral message in cave channel
- [x] Messages in DM for CoC
- [x] Setup basement channel
    - image
    - text
    - audio
    - button
- [x] Remove basement from flow
- [ ] Add legacy tokens (blocking on getting a legacy token)
    - [ ] Use legacy tokens on invite
    - Check if https://api.slack.com/scim is an alternative
- [x] Setup cave channel
    - [x] Default messages
    - [x] Public
    - [x] New messages aren't allowed
- [x] Disable old clippy flow
- [x] Fix bug where user is not promoted
- [x] Fix bug where user is DM'ed twice on starting flow
- [x] Setup #toriels-diary channel
    - [x] slash commands
    - [x] buttons
    - [x] messages, mentions, etc.

</details>