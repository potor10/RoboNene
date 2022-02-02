const { MessageEmbed } = require('discord.js');
const { BOT_NAME, NENE_COLOR, FOOTER } = require('../../constants');

const COMMAND = require('../command_data/about')

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
        { name: '**Programming**', value: '\n\n\n', inline: true},
        { name: '**Design**', value: 'Potor10#3237\n', inline: true},
        { name: '**Testing**', value: 'Potor10#3237\n', inline: true },
        { name: '**Game Data**', value: '[Sekai World]()' },
        { name: '**Calculating Estimation**', value: '[Bandori Estimation]()'},
        { name: '**Ranking Data**', value: '[Sekai Best]()' },
        { name: '**Discord**', value: '' },
        { name: '**Project Sekai**', value: '' },
        { name: '**Contribute**', value: '' },
        { name: '**Tech Stack**', value: '' },
        { name: '**License**', value: 'MIT' },
      )
      .setTimestamp()
      .setFooter(FOOTER, botAvatarURL);

    await interaction.editReply({ embeds: [aboutEmbed] });
  }
};