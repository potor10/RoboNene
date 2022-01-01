const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('About Robo Nene'),
  
  async execute(interaction) {
    return
  }
}