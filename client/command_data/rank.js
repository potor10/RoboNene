module.exports = {
  'INFO': {
    'name': 'rank',
    'utilization': '/rank',
    'description': 'Display your current ranking on the leaderboard.',
    'ephemeral': true,
    'params': [
      {
        'type': 'user',
        'name': 'user',
        'required': false,
        'description': 'An optional target in your current discord server'
      }
    ],
  
    'requiresLink': true
  },

  'CONSTANTS': {
    'NO_ACC_ERROR': {
      'type': 'Error',
      'message': 'This user has not linked their project sekai account with the bot.'
    }
  }
}