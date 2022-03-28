## Working tasks

- [x] Setup messages in cave channel
    - image
    - text
    - audio
- [x] Ephemeral message in cave channel
- [x] Messages in DM for CoC
<!-- - [ ] Joining basement channel -->
- [x] Setup basement channel
    - image
    - text
    - audio
    - button
- [ ] Setting up basement to actually open

# Tu toriel

_ Just a lil' ol greeter bot to direct new members joining the Hack Club Slack. You wonder what she might say..._

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
