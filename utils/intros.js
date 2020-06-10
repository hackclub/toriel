const defaultIntro = [
	{
		"type": "section",
		"text": {
			"type": "mrkdwn",
			"text": `Hi, I'm Clippy! My job is to help you join the Hack Club community. Do you need assistance?`
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
exports.defaultIntro = defaultIntro

const som = [
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
exports.som = som