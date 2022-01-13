const defaultIntro = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `Hi there, I'm Clippy! It looks like you want join the Hack Club community. Before you unlock it, I need to show you around for a minute! Could you please click that button :point_down: so we can get this show on the road?`
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
          "text": "Let me in, Clippy!"
        },
        "action_id": "intro_progress_1"
      }
    ]
  }
]
exports.defaultIntro = defaultIntro

const jankathonIntro = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `Hi there, I'm Clippy! It looks like you want join the Hack Club community for the Jankathon. Before you unlock it, I need to show you around for a minute! Could you please click that button :point_down: so we can get this show on the road?`
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
          "text": "Let me in, Clippy!"
        },
        "action_id": "intro_progress_1"
      }
    ]
  }
]
exports.jankathonIntro = jankathonIntro

const som = [
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `Hi there, I'm Clippy! It looks like you want join the Hack Club community. Before you unlock it, I need to show you around for a minute! Could you please click that button :point_down: so we can get this show on the road?`
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
exports.som = som
