/**
 * @fileoverview The main output when users call for the /skillorder command
 * Sends a order from Left to Right for Best to Worst player skill order
 * @author Ai0796
 */

const { MessageActionRow, MessageButton } = require('discord.js');
const { BOT_NAME } = require('../../constants');

const COMMAND = require('../command_data/skillorder')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed')

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        await interaction.reply("test")
    }
};