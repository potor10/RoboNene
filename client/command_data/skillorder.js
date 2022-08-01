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
        'description': 'Shows the Optimal Skill Order (Best to Worst) of a Song',
        'ephemeral': false,
        'params': [
            {
                'type': 'integer',
                'name': 'song',
                'required': false,
                'description': 'Song Name',
                'choices': [
                    ["Intense Voice of Hatsune Miku", 131],
                    ["Melt", 47],
                    ["World is Mine", 48],
                    ["Chikyuu Saigo no Kkuhaku wo", 154],
                    ["Hitorinbo Envy", 74],
                    ["Jack Pot Sad Girl", 62],
                    ["Viva Happy", 11],
                    ["ODDS&ENDS", 117],
                    ["Dramaturgy", 91],
                    ["Ready Steady", 54]
                ]
            }
        ]
    },

    'CONSTANTS': {}
}