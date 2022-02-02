module.exports = {
  'INFO': {
    'name': 'link',
    'utilization': '/link',
    'description': 'Link your Project Sekai account to Robo Nene!',
    'subcommands': [
      {
        'name': 'request',
        'description': 'Request a code to link your Project Sekai user ID to your Discord Account.',
        'params': [
          {
            'type': 'string',
            'name': 'id',
            'required': true,
            'description': 'The ID of the Project Sekai account you are trying to link.'
          }
        ]
      },
      {
        'name': 'authenticate',
        'description': 'Confirm that the token is placed into your Project Sekai profile description.'
      }
    ]
  },

  'CONSTANTS': {
    'DISCORD_LINKED_ERR': {
      'type': 'Error',
      'message': 'Your Discord account is already linked to a Project Sekai account.'
    },
  
    'SEKAI_LINKED_ERR': {
      'type': 'Error',
      'message': 'That Project Sekai account is already linked to another Discord account.'
    },
  
    'LINK_SUCC': {
      'type': 'Success',
      'message': 'Your account is now linked.'
    },
  
    'BAD_ID_ERR': {
      'type': 'Error', 
      'message': 'You have provided an invalid ID.'
    },
  
    'BAD_ACC_ERR': {
      'type': 'Error',
      'message': 'There was an issue in finding this account. Please request a new link code. \nMake sure all the digits are typed correctly.'
    },
  
    'EXPIRED_CODE_ERR': {
      'type': 'Error',
      'message': 'Your link code has expired.'
    },
  
    'BAD_CODE_ERR': {
      'type': 'Error', 
      'message': 'Invalid code on Project Sekai profile. \nDid you remember to press back on your profile to save the changes?'
    },
  
    'NO_CODE_ERR': {
      'type': 'Error', 
      'message': 'Please request a link code first.'
    }
  }
}