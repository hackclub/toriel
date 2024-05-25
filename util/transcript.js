const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const { metrics } = require('./metrics')
const { sendUrgent } = require('./alert')

const sample = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}
const loadTranscript = () => {
  try {
    var transcriptPath = path.resolve(__dirname, './transcript.yml')
    if (fs.existsSync(path.resolve(__dirname, './transcript.dev.yml')))
      transcriptPath = path.resolve(__dirname, './transcript.dev.yml')
    const doc = yaml.load(fs.readFileSync(transcriptPath, 'utf8'))
    return doc
  } catch (e) {
    console.error(e)
  }
}
const recurseTranscript = (searchArr, transcriptObj) => {
  const searchCursor = searchArr.shift()
  const targetObj = transcriptObj[searchCursor]

  if (!targetObj) {
    metrics.increment("events.transcript.load.failure", 1)
    sendUrgent({ summary: "Failed to load transcript.yml", detailed: "There was a failure loading the transcript.yml, which is breaking the app.\n\n" + transcript('errors.transcript') })
    throw new Error(transcript('errors.transcript'))
  }
  if (searchArr.length > 0) {
    return recurseTranscript(searchArr, targetObj)
  } else {
    if (Array.isArray(targetObj)) {
      return sample(targetObj)
    } else {
      return targetObj
    }
  }
}
const replaceErrors = (key, value) => {
  // from https://stackoverflow.com/a/18391400
  if (value instanceof Error) {
    const error = {}
    Object.getOwnPropertyNames(value).forEach((key) => {
      error[key] = value[key]
    })
    return error
  }
  return value
}

const transcript = (search, vars) => {
  if (vars) {
    console.log(
      `I'm searching for words in my yaml file under "${search}". These variables are set: ${JSON.stringify(
        vars,
        replaceErrors
      )}`
    )
  } else {
    console.log(`I'm searching for words in my yaml file under "${search}"`)
  }
  const searchArr = search.split('.')
  const transcriptObj = loadTranscript()
  let dehydratedTarget
  try {
    dehydratedTarget = recurseTranscript(searchArr, transcriptObj)
  } catch (e) {
    console.log(e)
    dehydratedTarget = search
  }
  return hydrateObj(dehydratedTarget, vars)
}
module.exports = { transcript }
const hydrateObj = (obj, vars = {}) => {
  if (obj == null) {
    return null
  }
  if (typeof obj === 'string') {
    return evalTranscript(obj, vars)
  }
  if (Array.isArray(obj)) {
    return obj.map((o) => hydrateObj(o, vars))
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      obj[key] = hydrateObj(obj[key], vars)
    })
    return obj
  }
}
const evalTranscript = (target, vars = {}) =>
  function () {
    return eval('`' + target + '`')
  }.call({
    ...vars,
    t: transcript,
  })
