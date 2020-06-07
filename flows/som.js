async function somFilter(e) {
	//placeholder validation
	//const userID = e.user_id || e.event.user || e.event.user.id
	//return userID === 'U0120F9NAGK'
	return e.text === 'som'
}

async function runInFlow(opts, func) {
	if (await somFilter(opts.command)) {
		return await func(opts)
	}
}

const loadFlow = app => {
	app.command('/hardware', e => runInFlow(e, async ({ command, ack, say }) => {
		await ack();
		console.log('got /hardware command from SOM user!')
	}))
	app.command('/restart', e => runInFlow(e, async ({ command, ack, say }) => {
		await ack();
		console.log('hiii')
		const islandName = await 'test-island-1'
		const newChannel = await app.client.conversations.create({
			token: process.env.SLACK_BOT_TOKEN,
			name: islandName,
			is_private: true,
			user_ids: process.env.BOT_USER_ID
		})
		const channelId = newChannel.channel.id
		console.log(`New tutorial channel created: ${channelId}`)

		await app.client.conversations.invite({
			token: process.env.SLACK_BOT_TOKEN,
			channel: channelId,
			users: command.user_id
		})
			.catch(err => console.log(err.data.errors))
		await app.client.chat.postMessage({
			token: process.env.SLACK_BOT_TOKEN,
			channel: channelId,
			text: 'hiiii'
		})
	}))
}

const startTutorial = async (user, restart) => {
	const islandName = await generateIslandName()
	const newChannel = await app.client.conversations.create({
		token: process.env.SLACK_BOT_TOKEN,
		name: islandName.channel,
		is_private: true,
		user_ids: process.env.BOT_USER_ID
	})
	const channelId = newChannel.channel.id
	console.log(`New tutorial channel created: ${channelId}`)

	await app.client.conversations.invite({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channelId,
		users: user
	})
		.catch(err => console.log(err.data.errors))
	await app.client.conversations.invite({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channelId,
		users: 'U012FPRJEVB'
	})
	await app.client.conversations.invite({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channelId,
		users: 'UH50T81A6' //banker
	})

	await app.client.conversations.setTopic({
		token: process.env.SLACK_OAUTH_TOKEN,
		channel: channelId,
		topic: `Welcome to Hack Club! :wave: Unlock the Summer of Making by completing this tutorial.`
	})

	if (restart) {
		let record = await getUserRecord(user)
		if (typeof record === 'undefined') {
			record = await islandTable.create({
				'Name': user,
				'Island Channel ID': channelId,
				'Island Channel Name': islandName.channel,
				'Has completed tutorial': false,
				'Has previously completed tutorial': false,
				'Pushed first button': false,
				'Flow': 'Summer of Making'
			})
		}
		await islandTable.update(record.id, {
			'Island Channel ID': channelId,
			'Island Channel Name': islandName.channel,
			'Has completed tutorial': true,
			'Pushed first button': false,
			'Flow': 'Summer of Making'
		})
	} else {
		await islandTable.create({
			'Name': user,
			'Island Channel ID': channelId,
			'Island Channel Name': islandName.channel,
			'Has completed tutorial': false,
			'Has previously completed tutorial': false,
			'Pushed first button': false,
			'Flow': 'Summer of Making'
		})
	}

	await app.client.chat.postMessage({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channelId,
		blocks: [
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
	})

	await timeout(30000)
	let pushedButton = await hasPushedButton(user)
	if (!pushedButton) {
		await sendMessage(channelId, `(<@${user}> Psst—every new member completes this quick intro to unlock the Hack Club community. It only takes 1 minute—I promise—and you get free stuff along the way. Click any of the three buttons above to begin :star2: :money_with_wings: :eye:)`, 10)
	}
}

exports.loadFlow = loadFlow