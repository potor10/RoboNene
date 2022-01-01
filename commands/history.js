const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Obtain the event data from a certain point'),
  
  async execute(interaction) {
    return;
  }
};