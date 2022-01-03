const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants');
const getRank = require('../methods/getRank')

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('spy')
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
    switch(interaction.options._subcommand) {
      case 'player':
        getRank(interaction, discordClient, {
          targetUserId: interaction.options._hoistedOptions[0].value
        })
        break
      case 'tier':
        getRank(interaction, discordClient, {
          targetRank: interaction.options._hoistedOptions[0].value
        })
        break
      default:
        await interaction.reply({
          content: ERR_COMMAND,
          ephemeral: true 
        });
    }
  }
};