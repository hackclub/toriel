const { transcript } = require('../transcript')

const defaultInvite = {
  channels: [
    transcript('channels.cave'),
    transcript('channels.shaded-spot-under-a-large-tree'),
  ],
  customMessage: 'While wandering through a forest, you stumble upon a cave...',
}

module.exports = { defaultInvite }
