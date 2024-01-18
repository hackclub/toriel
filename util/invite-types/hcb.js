const { transcript } = require('../transcript')

const hcbInvite = {
  channels: [
    transcript('channels.bank'),
    transcript('channels.shaded-spot-under-a-large-tree'),
  ],
  customMessage: 'While wandering through a forest, you stumble upon a cave...',
}

module.exports = { hcbInvite }
