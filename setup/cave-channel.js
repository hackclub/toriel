const axios = require('axios')
const { transcript } = require('../util/transcript')
const { client } = require('../app')

async function setupCaveChannel() {
  await postImage()
  // await postAudio()
  await postMessage()
}

async function postImage() {
  const file = await axios({
    method: 'get',
    url: transcript('files.cave-image'),
    responseType: 'stream',
  })
  const response = await client.files.upload({
    channels: transcript('channels.cave-a-a'),
    file: file.data,
    filename: 'you fall into a cave...',
    filetype: 'png',
  })
}

async function postMessage() {
  client.chat.postMessage({
    channel: transcript('channels.cave-a-a'),
    text: transcript('cave-intro'),
    icon_url: transcript('avatar.log'),
    blocks: [
      transcript('block.text', { text: transcript('cave-intro') }),
      transcript('block.single-button', {
        text: 'call for help',
        value: 'cave_start',
      }),
    ],
  })
}

async function postAudio() {
  const file = await axios({
    method: 'get',
    url: transcript('files.cave-audio'),
    responseType: 'stream',
  })
  console.log({ channel: transcript('channels.cave-a-a') })
  const response = await client.files.upload({
    channels: transcript('channels.cave-a-a'),
    file: file.data,
    filename: 'play me',
    filetype: 'm4a',
  })
}

module.exports = { setupCaveChannel }
