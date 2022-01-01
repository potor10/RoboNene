const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../constants.json');

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Project Sekai Profile')
    .addUserOption(op =>
      op.setName('user')
        .setDescription('Discord user')
        .setRequired(false)),

  async execute(interaction) {
    
    if (interaction.options._hoistedOptions.length > 0) {
      // User has targeted another user
      const exampleEmbed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(`${'some name'}'s Profile`)
        .setURL('https://discord.js.org/')
        .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        .setDescription('Some description here')
        .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        .addFields(
          { name: 'Regular field title', value: 'Some value here' },
          { name: '\u200B', value: '\u200B' },
          { name: 'Inline field title', value: 'Some value here', inline: true },
          { name: 'Inline field title', value: 'Some value here', inline: true },
        )
        .addField('Inline field title', 'Some value here', true)
        .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter(FOOTER, 'https://i.imgur.com/AfFp7pu.png');

        await interaction.reply({ embeds: [exampleEmbed] });
    } else {
      // User has not targeted another user
      await interaction.reply(JSON.stringify(interaction.options._hoistedOptions));
    }
  }
};