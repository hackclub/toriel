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
    detailed = '```' + detailed.replaceAll('`', 'ˋ') + '```'
    fetch(process.env.SLACK_WEBHOOK_INFO, {
      method: 'POST',
      body: JSON.stringify({
        text: detailed,
      }),
    })
  },
  /**
   * Sends an urgent alert to Slack and PagerDuty
   * @param {Object} options - The options for the alert.
   * @param {string} options.summary - The summary of the alert (for notifications)
   * @param {string} options.detailed - The detailed information of the alert.
   */
  sendUrgent: function ({ summary, detailed }) {
    detailed = '```' + detailed.replaceAll('`', 'ˋ') + '```'
    fetch(process.env.SLACK_WEBHOOK_ERROR, {
      method: 'POST',
      body: JSON.stringify({
        text: detailed,
      }),
    })
  },
}
