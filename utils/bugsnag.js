const bugsnag = () => {
  console.log('Loading bugsnag')
  if (process.env.BUGSNAG) {
    const Bugsnag = require('@bugsnag/js')
    Bugsnag.start(process.env.BUGSNAG)
  }
}
exports.bugsnag = bugsnag