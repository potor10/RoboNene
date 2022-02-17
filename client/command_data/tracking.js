module.exports = {
  'INFO': {
    'name': 'tracking',
    'utilization': '/tracking',
    'description': 'Add a live update event ranking tracker to a server.',
    'ephemeral': true,
    'params': [
      {
        'type': 'channel',
        'name': 'channel',
        'required': true,
        'description': 'The channel you want your tracking updates to go in'
      },
      {
        'type': 'integer',
        'name': 'time',
        'required': true,
        'description': 'How frequently the tracking updates',
        'choices': [
          ['2 minutes', 2],
          ['1 hour', 60]
        ]
      },
      {
        'type': 'boolean',
        'name': 'enable',
        'required': true,
        'description': 'Enable or disable the tracking alerts'
      }
    ],

    'adminOnly': true
  },

  'CONSTANTS': {
    'INVALID_CHANNEL_ERR': {
      type: 'Error',
      message: 'The channel you have selected is not a valid text channel.'
    },

    'NO_PERMISSIONS_ERR': {
      type: 'Error',
      message: 'The bot does not have \`\`Send Messages\`\` and \`\`Embed Links\`\` permissions in the selected channel.'
    },

    'NO_TRACKING_ERR': {
      type: 'Error',
      message: 'There are no tracking alerts for these parameters.'
    }
  }
}