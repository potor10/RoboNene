module.exports = {
  'INFO': {
    'name': 'spy',
    'utilization': '/spy',
    'description': 'Get information of any position on the leaderboard.',
    'subcommands': [
      {
        'name': 'player',
        'description': 'Get information on another player\'s ranking on the leaderboard.',
        'params': [
          {
            'type': 'string',
            'name': 'id',
            'required': true,
            'description': 'The ID of the Project Sekai account you are trying to find on the leaderboard.'
          }
        ]
      },
      {
        'name': 'tier',
        'description': 'Get information on a specific tier on the leaderboard.',
        'params': [
          {
            'type': 'integer',
            'name': 'tier',
            'required': true,
            'description': 'The tier that you want to get information on.'
          }
        ]
      }
    ],
  
    'requiresLink': true
  },

  'CONSTANTS': {
    'BAD_ID_ERR': {
      'type': 'Error', 
      'message': 'You have provided an invalid ID.'
    }
  }
}