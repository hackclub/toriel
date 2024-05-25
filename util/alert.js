/**
 * A utility module for sending alerts via Slack and Twilio.
 * @module alert
 */

module.exports = {
  /**
   * Sends an informational alert to Slack.
   * @param {Object} options - The options for the alert.
   * @param {string} options.summary - The summary of the alert (for notifications)
   * @param {string} options.detailed - The detailed information of the alert.
   */
  sendInfo: function ({ summary, detailed }) {
    fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify({
        text: detailed,
      }),
    })
  },
  /**
   * Sends an urgent alert to Slack and Twilio
   * @param {Object} options - The options for the alert.
   * @param {string} options.summary - The summary of the alert (for notifications)
   * @param {string} options.detailed - The detailed information of the alert.
   */
  sendUrgent: function ({ summary, detailed }) {
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
    fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify({
        text: detailed,
      }),
    })
    process.env.TWILIO_TO.split(',').forEach((phoneNumber, index, array) => {
      client.messages
        .create({
          body: summary,
          from: process.env.TWILIO_FROM,
          to: phoneNumber,
        })
        .then((message) => {
          console.info(
            `Sent urgent alert to user ${index + 1}/${array.length}: ${message.sid}`
          )
        })
    })
  },
}
