const { default: axios } = require("axios")
const { transcript } = require("../util/transcript")

async function setupBasementChannel(args) {
  const { client } = args
  await postImage(client)
//   await postMessage(client)
  await postAudio(client)
  await postButton(client)
}

async function postImage(client) {
  const file = await axios({ method: 'get', url: transcript('files.basement-image'), responseType: 'stream' })
  console.log({channel: transcript('channels.the-basement')})
  const response = await client.files.upload({
    channels: transcript('channels.the-basement'),
    file: file.data,
    filename: 'after opening the door to the basement, you see a long corridor',
    filetype: 'png'
  })
}

// async function postMessage(client) {
//   client.chat.postMessage({
//     channel: transcript('channels.the-basement'),
//     text: transcript('basement-intro')
//   })
// }

async function postAudio(client) {
  const file = await axios({ method: 'get', url: transcript('files.basement-audio'), responseType: 'stream' })
  console.log({channel: transcript('channels.the-basement')})
  const response = await client.files.upload({
    channels: transcript('channels.the-basement'),
    file: file.data,
    filename: 'play me',
    filetype: 'm4a'
  })
}

async function postButton(client) {
  client.chat.postMessage({
    channel: transcript('channels.the-basement'),
    blocks: [
      transcript('block.single-button', {
        text: "Step through and leave TORIEL's house...",
        value: 'enter-basement',
      })
    ]
  })
}

module.exports = { setupBasementChannel }