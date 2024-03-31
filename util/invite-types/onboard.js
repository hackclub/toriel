const { transcript } = require('../transcript')

const onboardInvite = {
  channels: [
    transcript('channels.onboard'),
    transcript('channels.super-duper-shubham-toriel-testing'),
  ],
  customMessage: 'Welcome onboard!',
}

module.exports = { onboardInvite }
