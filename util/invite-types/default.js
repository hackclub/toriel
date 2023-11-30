const { transcript } = require('../transcript')

const defaultInvite = {
  channels: [transcript('channels.cave'), transcript('channels.waiting-room')],
  customMessage: 'While wandering through a forest, you stumble upon a cave...',
}

module.exports = { defaultInvite }
