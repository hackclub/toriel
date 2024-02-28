const { prisma } = require('../db')
const { transcript } = require('../util/transcript')

async function scheduleHelpMeMessage(client, user_id) {
  const postDate = new Date()
  //6 hours into the future
  postDate.setTime(postDate.getTime() + 10 * 60 * 1000)

  const dbUser = await prisma.user.findFirst({ where: { user_id } })

  const userInvite = await prisma.invite.findFirst({
    where: { user_id: user_id },
  })

  if (userInvite.schedule_stuck_message_id) {
    try {
      const deleteResult = await client.chat.deleteScheduledMessage({
        channel: transcript('channels.welcome-committee'),
        scheduled_message_id: userInvite.schedule_stuck_message_id,
      })

      console.log(deleteResult)
    } catch (error) {
      console.log(error, userInvite.schedule_stuck_message_id)
    }

    await prisma.invite.updateMany({
      where: {
        user_id: user_id,
      },
      data: {
        schedule_stuck_message_id: null,
      },
    })
  }

  if (dbUser.toriel_stage !== 'FINISHED') {
    const result = await client.chat.scheduleMessage({
      channel: transcript('channels.welcome-committee'),
      text: transcript('notify-stage', {
        user: user_id,
        step: dbUser.toriel_stage,
      }),
      post_at: Math.floor(postDate.getTime() / 1000),
    })

    console.log(result)

    if (result.ok) {
      await prisma.invite.updateMany({
        where: { user_id },
        data: {
          schedule_stuck_message_id: result.scheduled_message_id,
        },
      })
    } else {
      await client.chat.postMessage({
        channel: transcript('channels.welcome-committee'),
        text: `Error: cannot post schedule "help me" message for <@${user_id}>. Reason: ${result.error}`,
      })

      console.log(`Error in notify-channel.js notifyStage(): ${result}`)
    }
  }
}

async function destroyHelpMeMessage(client, user_id) {}

module.exports = { scheduleHelpMeMessage, destroyHelpMeMessage }
