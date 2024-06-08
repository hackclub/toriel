async function invite(args) {
  const { client, body, command, respond } = args
  const user = await client.users.info({ user: command.user_id })
  if (!user.user.is_admin)
    return await respond(
      'Sorry, only admins can use /toriel-invite. Please instruct the person to use https://hackclub.com/slack to join.\n💡 Protip: Append ?event=[insert channel name] to the url (i.e. https://hackclub.com/slack?event=outernet) to add the person you wish to invite to the channel automagically (this only works if toriel has it specified it in <https://github.com/hackclub/toriel/blob/main/util/transcript.yml|transcript.yaml>)'
    )
  client.views.open({
    trigger_id: body.trigger_id,
    view: {
      callback_id: 'admin_invite_user',
      title: {
        type: 'plain_text',
        text: 'Invite a user',
        emoji: true,
      },
      submit: {
        type: 'plain_text',
        text: 'Submit',
        emoji: true,
      },
      type: 'modal',
      close: {
        type: 'plain_text',
        text: 'Cancel',
        emoji: true,
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'This modal will invite a user to Slack',
          },
        },
        {
          type: 'input',
          element: {
            type: 'plain_text_input',
            action_id: 'name',
          },
          label: {
            type: 'plain_text',
            text: 'Full name',
            emoji: true,
          },
        },
        {
          type: 'input',
          element: {
            type: 'email_text_input',
            action_id: 'email',
          },
          label: {
            type: 'plain_text',
            text: 'Email',
            emoji: true,
          },
        },
        {
          type: 'input',
          element: {
            type: 'plain_text_input',
            action_id: 'reason',
          },
          label: {
            type: 'plain_text',
            text: 'Reason',
            emoji: true,
          },
        },
        {
          type: 'input',
          element: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select a continent',
              emoji: true,
            },
            options: [
              {
                text: {
                  type: 'plain_text',
                  text: 'Africa',
                  emoji: true,
                },
                value: 'AFRICA',
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'Asia',
                  emoji: true,
                },
                value: 'ASIA',
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'Australia',
                  emoji: true,
                },
                value: 'AUSTRALIA',
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'Europe',
                  emoji: true,
                },
                value: 'EUROPE',
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'North America',
                  emoji: true,
                },
                value: 'NORTH_AMERICA',
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'South America',
                  emoji: true,
                },
                value: 'SOUTH_AMERICA',
              },
            ],
            action_id: 'continent',
          },
          label: {
            type: 'plain_text',
            text: 'Continent',
            emoji: true,
          },
        },
      ],
    },
  })
}

module.exports = invite
