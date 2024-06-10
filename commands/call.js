const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')
const { metrics } = require('../util/metrics')

async function call({ respond }) {
  metrics.increment('events.commands.run.call', 1)
  const messageToSend = transcript('command.cell')
  const messageLines = messageToSend.split('\n')
  for (let i = 0; i < messageLines.length; i++) {
    let line = messageLines[i]
    if (line != '') {
      await sleep(line.length * 15)

      await respond({
        text: line,
      })
    }
  }
}
module.exports = call
