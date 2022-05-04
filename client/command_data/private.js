/**
 * @fileoverview Command Data & Constants Related to the /private command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants values used exclusively in the /private command.
 * @author Potor10
 */

module.exports = {
  'INFO': {
    'name': 'private',
    'utilization': '/private',
    'description': 'Enable or disable additional information displayed when using /profile. (Private by default)',
    'ephemeral': true,
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