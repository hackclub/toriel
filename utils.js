const AirtablePlus = require('airtable-plus')

const islandTable = new AirtablePlus({
	apiKey: process.env.AIRTABLE_API_KEY,
	baseID: 'appYGt7P3MtotTotg',
	tableName: 'Tutorial Island'
})

const sendEphemeralMessage = async (app, channel, text, user) => {
	return await app.client.chat.postEphemeral({
		token: process.env.SLACK_BOT_TOKEN,
		channel: channel,
		text: text,
		user: user,
	})
}
exports.sendEphemeralMessage = sendEphemeralMessage

const getIslandId = async (userId) => {
	let record = await getUserRecord(userId)
	if (typeof record === 'undefined') return null
	return record.fields['Island Channel ID']
}
exports.getIslandId = getIslandId

const hasPushedButton = async (userId) => {
	let record = await getUserRecord(userId)
	if (typeof record === 'undefined') return true
	return record.fields['Pushed first button']
}
exports.hasPushedButton = hasPushedButton

const hasCompletedTutorial = async (userId) => {
	let record = await getUserRecord(userId)
	if (typeof record === 'undefined') return true
	return (record.fields['Has completed tutorial'] || record.fields['Club leader'])
}
exports.hasCompletedTutorial = hasCompletedTutorial

const getUserRecord = async (userId) => {
	try {
		let record = (await islandTable.read({
			filterByFormula: `{Name} = '${userId}'`,
			maxRecords: 1
		}))[0]
		return record
	} catch { }
}
exports.getUserRecord = getUserRecord