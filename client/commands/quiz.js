const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { BOT_NAME, NENE_COLOR, FOOTER } = require('../../constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Fun Project Sekai Quiz'),
  
  async execute(interaction, discordClient) {
    const botAvatarURL = discordClient.client.user.displayAvatarURL()

  }
}