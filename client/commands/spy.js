const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants');

const COMMAND_NAME = 'spy'

const getRank = require('../methods/getRank')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const SPY_CONSTANTS = {
  'BAD_ID_ERR': {
    type: 'Error', 
    message: 'You have provided an invalid ID.'
  },
}

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Spy on the leaderboard')
    .addSubcommand(sc =>
      sc.setName('player')
        .setDescription('Spy on another player\'s ranking on the leaderboard')
        .addStringOption(op =>
          op.setName('id')
            .setDescription('Project Sekai user ID')
          .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('tier')
        .setDescription('Spy on a rank on the leaderboard')
        .addNumberOption(op =>
          op.setName('tier')
            .setDescription('The tier you want to spy on')
          .setRequired(true))),
  
  async execute(interaction, discordClient) {

    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND_NAME, discordClient)],
      fetchReply: true
    })

    if (interaction.options._subcommand === 'player') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');
      if (!accountId) {
        // Do something because there is an empty account id input
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND_NAME, SPY_CONSTANTS.BAD_ID_ERR, discordClient)]
        })
      } else {
        getRank(COMMAND_NAME, deferredResponse, discordClient, {
          targetUserId: interaction.options._hoistedOptions[0].value
        })
      }
    } else if (interaction.options._subcommand === 'tier') {
      getRank(COMMAND_NAME, deferredResponse, discordClient, {
        targetRank: interaction.options._hoistedOptions[0].value
      })
    } else {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND_NAME, ERR_COMMAND, discordClient)]
      });
    }
  }
};