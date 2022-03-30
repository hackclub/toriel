const { sleep } = require('../util/sleep')
const { transcript } = require('../util/transcript')

async function call({ respond }) {
  const messageToSend = transcript('command.cell')
  const messageLines = messageToSend.split('\n')
  for (let i = 0; i < messageLines.length; i++) {
    let line = messageLines[i]
    if (line != "") {
      await sleep(line.length * 15)

      await respond({
        text: line,
      })
    }
  }
}
module.exports = call
