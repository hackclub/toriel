
module.exports = {
    sendInfo: function ({ summary, detailed }) {
        fetch(process.env.SLACK_WEBHOOK, {
            method: "POST",
            body: JSON.stringify({
                text: detailed
            })
        })
    },
    sendUrgent: function({ summary, detailed }){
        const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        process.env.TWILIO_TO.split(",").forEach((phoneNumber, index, array) => {
            client.messages
                .create({
                    body: summary,
                    from: process.env.TWILIO_FROM,
                    to: phoneNumber
                })
                .then(message => {
                    console.info(`Sent urgent alert to user ${index + 1}/${array.length}: ${message.sid}`)
                });
        })
    }
}