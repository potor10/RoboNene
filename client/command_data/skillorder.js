/**
 * @fileoverview Command Data & Constants Related to the /about command
 * These constants are used to dynamically generate a slash command on discord.
 * This File also contains the constants values used exclusively in the /about command.
 * @author Ai0796
 */

module.exports = {
    'INFO': {
        'name': 'skillorder',
        'utilization': '/skillorder',
        'description': 'Show the current T100 leaderboard',
        'ephemeral': false,
        'params': [
            {
                'type': 'integer',
                'name': 'rank',
                'required': false,
                'description': 'Optional rank to jump to.'
            }
        ]
    },

    'CONSTANTS': {}
}