const { transcript } = require('../util/transcript')
const { client } = require('../app')

async function setupCaveChannel() {
  await postImage()
  // await postAudio()
  await postMessage()
}

async function postImage() {
  const file = Buffer.from((await (await fetch(transcript('files.cave-image'))).arrayBuffer()))
  const response = await client.files.uploadV2({
    channels: transcript('channels.cave'),
    file: file,
    filename: 'you fall into a cave...',
  })
}

async function postMessage() {
  client.chat.postMessage({
    channel: transcript('channels.cave'),
    text: transcript('cave-intro'),
    icon_url: transcript('avatar.log'),
    blocks: [
      transcript('block.text', { text: transcript('cave-intro') }),
      transcript('block.single-button', {
        text: 'Explore the cave',
        value: 'cave_start',
      }),
    ],
  })
}

async function postAudio() {
  const file = Buffer.from((await (await fetch(transcript('files.cave-audio'))).arrayBuffer()))
  console.log({
    channel: transcript('channels.cave'),
  })
  const response = await client.files.uploadV2({
    channels: transcript('channels.cave'),
    file: file.data,
    filename: 'play me',
  })
}

module.exports = { setupCaveChannel }
