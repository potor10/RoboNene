const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('graph')
    .setDescription('About Robo Nene'),
  
  async execute(interaction) {
    return
  }
}