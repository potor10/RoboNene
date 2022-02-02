module.exports = {
  'INFO': {
    'name': 'private',
    'utilization': '/private',
    'description': 'Determines if extra information that will display on your profile. (Private by default)',
    'params': [
      {
        'type': 'boolean',
        'name': 'enable',
        'required': true,
        'description': 'Enable or disable your profile\'s privacy'
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