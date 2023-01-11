const { transcript } = require('./util/transcript')
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)


export async function inferResponse({msg}) {

  const prompt = transcript('gpt_prompt', {msg})

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
  })

  return completion
}