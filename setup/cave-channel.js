const { default: axios } = require('axios')
const { transcript } = require('../util/transcript')

async function setupCaveChannel(args) {
  const { client } = args
  await postImage(client)
  await postMessage(client)
  await postAudio(client)
}

async function postImage(client) {
  const file = await axios({
    method: 'get',
    url: transcript('files.cave-image'),
    responseType: 'stream',
  })
  console.log({ channel: transcript('channels.cave') })
  const response = await client.files.upload({
    channels: transcript('channels.cave'),
    file: file.data,
    filename: 'you fall into a cave...',
    filetype: 'png',
  })
}

async function postMessage(client) {
  client.chat.postMessage({
    channel: transcript('channels.cave'),
    text: transcript('cave-intro'),
  })
}

async function postAudio(client) {
  const file = await axios({
    method: 'get',
    url: transcript('files.cave-audio'),
    responseType: 'stream',
  })
  console.log({ channel: transcript('channels.cave') })
  const response = await client.files.upload({
    channels: transcript('channels.cave'),
    file: file.data,
    filename: 'play me',
    filetype: 'm4a',
  })
}

module.exports = { setupCaveChannel }
