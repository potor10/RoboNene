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
                'name': 'song',
                'required': false,
                'description': 'Song Name',
                'choices': [
                    ["Melt", 47],
                    ["Hitorinbo Envy", 74]
                ]
            }
        ]
    },

    'CONSTANTS': {}
}