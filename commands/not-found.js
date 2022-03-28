const { transcript } = require('../util/transcript')

async function notFound({ respond }) {
  await respond({
    text: transcript('command.not-found'),
  })
}
module.exports = notFound
