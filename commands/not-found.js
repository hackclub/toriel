const { transcript } = require('../util/transcript')
const { metrics } = require('../util/metrics')
async function notFound({ respond }) {
  metrics.increment("events.commands.run.notfound", 1)
  await respond({
    text: transcript('command.not-found'),
  })
}
module.exports = notFound
