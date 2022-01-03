const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Display your current ranking on the leaderboard')
    .addUserOption(op =>
      op.setName('user')
        .setDescription('Discord user')
        .setRequired(false)),
  
  async execute(interaction, commandParams) {

  }
};