module.exports = {
  'INFO': {
    'name': 'tracking',
    'utilization': '/tracking',
    'description': 'Add a live update event ranking tracker to a server.',
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
    
  }
}