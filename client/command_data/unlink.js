module.exports = {
  'INFO': {
    'name': 'unlink',
    'utilization': '/unlink',
    'description': 'Unlink a Discord account from your Project Sekai account!',
    'subcommands': [
      {
        'name': 'request',
        'description': 'Request a code to unlink your Project Sekai user ID from a Discord Account.',
        'params': [
          {
            'type': 'string',
            'name': 'id',
            'required': true,
            'description': 'Your Project Sekai user ID.'
          }
        ]
      },
      {
        'name': 'authenticate',
        'description': 'Confirm that the code is set to your Project Sekai profile description.'
      }
    ]
  },

  'CONSTANTS': {
    'EXPIRED_CODE_ERR': {
      'type': 'Error',
      'message': 'Your link code has expired'
    },
  
    'BAD_CODE_ERR': {
      'type': 'Error',
      'message': 'Invalid code on Project Sekai profile. \nDid you remember to press back on your profile to save the changes?'
    },
  
    'NO_CODE_ERR': {
      'type': 'Error',
      'message': 'Please request a link code first.'
    },
  
    'NO_SEKAI_ERR': {
      'type': 'Error',
      'message': 'This Project Sekai account is not linked to any Discord account.'
    },
  
    'NO_DISCORD_LINK': {
      'type': 'Error',
      'message': 'This Discord account is not linked to any Project Sekai account.'
    },
  
    'BAD_ID_ERR': {
      'type': 'Error', 
      'message': 'You have provided an invalid ID.'
    },
  
    'BAD_ACC_ERR': {
      'type': 'Error',
      'message': 'There was an issue in finding this account. Please request a new link code. \nMake sure all the digits are typed correctly.'
    },
  
    'UNLINK_SUCC': {
      'type': 'Success',
      'message': 'Your account is now unlinked.'
    }
  }
}