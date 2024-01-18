const { transcript } = require('../transcript')

const onboardInvite = {
  channels: [
    transcript('channels.onboard'),
    transcript('channels.cave'),
    transcript('channels.shaded-spot-under-a-large-tree'),
  ],
  customMessage: 'Welcome onboard!',
}

module.exports = { onboardInvite }
