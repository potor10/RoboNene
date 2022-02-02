module.exports = {
  'INFO': {
    'name': 'cutoff',
    'utilization': '/cutoff',
    'description': 'Obtain detailed information about the the cutoff',
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
      },
      {
        'type': 'boolean',
        'name': 'detailed',
        'required': false,
        'description': 'Show extra detailed cutoff information'
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

    'NO_RESPONSE_ERR': {
      'type': 'Error',
      'message': 'There was no response from the server. \nPlease wait ~10 minutes after ranking concludes before trying again.'
    },

    'BAD_INPUT_ERROR': {
      'type': 'Error',
      'message': 'There was an issue with your input parameters. Please try again.'
    },
  
    'SEKAI_BEST_HOST': 'api.sekai.best',

    'PRED_WARNING': 'You are trying to view predictions for a tier that is lower than 100. These tiers are highly volatile and thus it is highly not recommended to use the following cutoff predictions!',
    'PRED_DESC': 'Fits data into a least squares regression line to generate a prediction.',
    'SMOOTH_PRED_DESC': 'Uses a weighted average of estimations from previous models. Generally, smoothed estimates are more resilient to sudden changes in point gain.',

    'NAIVE_DESC': 'Current Score + (Average Points Per Hour \\* Hours Left)',
    'NAIVE_LAST_HR_DESC': 'Current Score + (Average Points Per Hour [Last Hour] \\* Hours Left)'
  }
}