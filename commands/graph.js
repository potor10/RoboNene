const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('graph')
    .setDescription('Create a visualization')
    .addSubcommand(sc =>
      sc.setName('cutoff')
        .setDescription('Create a graph of the score at a certain cutoff'))
    .addSubcommand(sc =>
      sc.setName('ranking')
        .setDescription('Create a graph of a player\'s T100 ranking')
        .addUserOption(op =>
          op.setName('user')
            .setDescription('Discord user')
            .setRequired(false))),
  
  async execute(interaction) {
    return;
  }
};