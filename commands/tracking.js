const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tracking')
    .setDescription('Add a tracking post to a server')
    .addChannelOption(op => 
      op.setName('channel')
        .setDescription('The channel you want your tracking updates to go in')
        .setRequired(true))
    .addIntegerOption(op =>
      op.setName('time')
        .setDescription('How frequently the tracking updates')
        .setRequired(true)
        .addChoice('2 minutes', 2)
        .addChoice('1 hour', 60)),
  
  async execute(interaction, logging, db) {
    return
  }
}