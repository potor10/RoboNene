const { MessageEmbed } = require('discord.js');
const { BOT_NAME, NENE_COLOR, FOOTER } = require('../../constants');

const COMMAND = require('./about.json')

const generateSlashCommand = require('../methods/generateSlashCommand')

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: true
    })

    const botAvatarURL = discordClient.client.user.displayAvatarURL()

    const aboutEmbed = new MessageEmbed()
      .setColor(NENE_COLOR)
      .setTitle(`About ${BOT_NAME}`)
      .setDescription('Contributions and Credits')
      .setThumbnail(botAvatarURL)
      .addFields(
        { name: '**Programming**', value: 'Potor10#3237\nUlt#0001\nRedside#1337\nYuu#6883', inline: true},
        { name: '**Design**', value: 'Potor10#3237\nReinhäla#4444', inline: true},
        { name: '**Testing**', value: 'Potor10#3237\nReinhäla#4444', inline: true },
        { name: '**Game Data**', value: '[Sekai World](https://github.com/Sekai-World/sekai-master-db-en-diff/blob/main/events.json)' },
        { name: '**Calculating Estimation**', value: '[Bandori Estimation](https://docs.google.com/document/d/1137qbA0_qWOHJGhaYfxpgftqhsJvW4qo3QBTcSqnZo8/edit#heading=h.pkcfws4d84gx)'},
        { name: '**Ranking Data**', value: '[Sekai Best](https://api.sekai.best/docs)' },
        { name: '**Discord**', value: 'Robo Nene logs the usage of her commands to prevent abuse. ' + 
          'Outside of the use of her commands, Robo Nene does not collect any user data, chat logs, or server information. ' + 
          'Robo nene’s code is open-source, you can check it out at [github](https://github.com/potor10/RoboNene).' },
        { name: '**Project Sekai**', value: 'Linking accounts with Robo Nene is non-invasive. ' + 
          'Robo Nene will never ask for, nor ever need access to your Project Sekai account to function. ' + 
          'Linking accounts exists solely to prevent misuse of certain commands and provide ease of integration between a user and their Project Sekai account.' },
        { name: '**Contribute**', value: 'You can contribute to Robo Nene by opening a pull request at [github](https://github.com/potor10/RoboNene/pulls).' },
        { name: '**Tech Stack**', value: 'Robo Nene utilizes discord.js to serve her content. ' + 
          'Robo Nene saves tiering history and linked account information through use of sqlite3 databases. ' +
          'Robo Nene uses regression-js to fit data into a linear model and provide estimates.' },
        { name: '**License**', value: 'MIT' },
      )
      .setTimestamp()
      .setFooter(FOOTER, botAvatarURL);

    await interaction.editReply({ embeds: [aboutEmbed] });
  }
};