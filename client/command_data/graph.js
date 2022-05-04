/**
 * @fileoverview Command Data & Constants Related to the /graph command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants and error values used exclusively in the /graph command.
 * @author Potor10
 */

module.exports = {
  'INFO': {
    'name': 'graph',
    'utilization': '/graph',
    'description': 'Display a graph displaying the historical amount of points at a certain cutoff',
    'ephemeral': false,
    'params': [
      {
        'type': 'integer',
        'name': 'tier',
        'required': true,
        'description': 'The cutoff tier specified',
        'choices': [
          ['T1', 1],
          ['T2', 2],
          ['T3', 3],
          ['T10', 10],
          ['T20', 20],
          ['T30', 30],
          ['T40', 40],
          ['T50', 50],
          ['T100', 100],
          ['T200', 200],
          ['T300', 300],
          ['T400', 400],
          ['T500', 500],
          ['T1000', 1000],
          ['T2000', 2000],
          ['T3000', 3000],
          ['T4000', 4000],
          ['T5000', 5000],
          ['T10000', 10000],
          ['T20000', 20000],
          ['T30000', 30000],
          ['T40000', 40000],
          ['T50000', 50000]
        ]
      }
    ]
  },

  'CONSTANTS': {
    'NO_EVENT_ERR': {
      'type': 'Error',
      'message': 'There is currently no event going on'
    },
  
    'NO_DATA_ERR': {
      'type': 'Error',
      'message': 'Please cloose a different cutoff tier'
    },
  
    'SEKAI_BEST_HOST': 'api.sekai.best'
  }
}