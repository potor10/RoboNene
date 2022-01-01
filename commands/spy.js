const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('spy')
    .setDescription('Spy on another player\'s ranking on the leaderboard')
    .addStringOption(op =>
      op.setName('id')
        .setDescription('Project Sekai user ID')
        .setRequired(true)),
  
  async execute(interaction) {
    
  }
};