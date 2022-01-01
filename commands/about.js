const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { BOT_NAME, NENE_COLOR, FOOTER } = require('../constants.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('About Robo Nene'),
  
  async execute(interaction) {
    const aboutEmbed = new MessageEmbed()
      .setColor(NENE_COLOR)
      .setTitle(`About ${BOT_NAME}`)
      .setDescription(``)
      .addFields(
        { name: '**Programming**', value: 'Potor10#3237\nUlt#0001\nRedside#1337' },
        { name: '**Design**', value: 'Potor10#3237\nReinhäla#4444' },
        { name: '**Testing**', value: 'Potor10#3237\nReinhäla#4444' },
        { name: '**Schedule Data**', value: '[Sekai World](https://github.com/Sekai-World/sekai-master-db-en-diff/blob/main/events.json)' },
        { name: '**Discord**', value: 'Robo Nene logs the usage of her commands to prevent abuse. ' + 
          'Outside of the use of her commands, Robo Nene does not collect user data, chat logs, or server information. ' + 
          'Robo nene’s code is open-source, you can check it out at [github](https://github.com/potor10/RoboNene)' },
        { name: '**Project Sekai**', value: 'Linking accounts with Robo Nene is non-invasive. ' + 
          'Robo Nene will never ask for, nor ever need access to your Project Sekai account to function. ' + 
          'Linking accounts exists solely to prevent misuse of certain commands and provide ease of integration between a user and their Project Sekai account.' },
        { name: '**Contribute**', value: 'You can contribute to Robo Nene by opening a pull request at [github](https://github.com/potor10/RoboNene/pulls).' },
        { name: '**Tech Stack**', value: 'Robo Nene utilizes discord.js to serve her content. ' + 
          'Robo nene saves tiering history and linked account information through use of sqlite3 databases.' },
        { name: '**License**', value: 'MIT' },
      )
      .setTimestamp()
      .setFooter(FOOTER, 'https://i.imgur.com/AfFp7pu.png');

    await interaction.reply({ embeds: [aboutEmbed] });
  }
}