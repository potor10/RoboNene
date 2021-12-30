const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Sends a random gif!')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The gif category')
        .setRequired(true)
        .addChoice('Funny', 'gif_funny')
        .addChoice('Meme', 'gif_meme')
        .addChoice('Movie', 'gif_movie'))
    .addStringOption(option =>
      option.setName('input')
        .setDescription('The input to echo back')
        .setRequired(true)),
}