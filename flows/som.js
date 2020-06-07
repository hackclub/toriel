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

exports.loadFlow = loadFlow