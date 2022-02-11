const bugsnag = async () => {
  if (process.env.BUGSNAG) {
    const Bugsnag = require('@bugsnag/js')
    Bugsnag.start(process.env.BUGSNAG)
  }
}
exports.bugsnag = bugsnag