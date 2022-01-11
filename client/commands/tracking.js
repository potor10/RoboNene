const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants');

const COMMAND_NAME = 'tracking'

const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
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
        .addChoice('1 hour', 60))
    .addBooleanOption(op => 
      op.setName('enable')
        .setDescription('Enable or disable the tracking alerts')
        .setRequired(true)),
  
  async execute(interaction, discordClient) {
    const db = discordClient.db

    const channelData = interaction.options._hoistedOptions[0]
    console.log(channelData)

    if (channelData.channel.type !== 'GUILD_TEXT') {
      const content = {
        type: 'Error',
        message: 'The channel you have selected is not a valid text channel'
      }

      await interaction.reply({
        embeds: [generateEmbed(COMMAND_NAME, content, discordClient)],
        ephemeral: true
      });

      return
    }

    if (interaction.options._hoistedOptions[2].value) {
      db.prepare('REPLACE INTO tracking (channel_id, guild_id, tracking_type) ' + 
        'VALUES (@channelId, @guildId, @trackingType)').run({
        channelId: channelData.value,
        guildId: channelData.channel.guildId,
        trackingType: interaction.options._hoistedOptions[1].value
      });

      const content = {
        type: 'Success',
        message: `Alert Type: \`\`${interaction.options._hoistedOptions[1].value} min\`\`\n` +
          `Status: \`\`Enabled\`\`\n` +
          `Channel: \`\`${channelData.channel.name}\`\`\n` +
          `Guild: \`\`${channelData.channel.guild.name}\`\``
      }

      await interaction.reply({
        embeds: [generateEmbed(COMMAND_NAME, content, discordClient)],
        ephemeral: true 
      });
    } else {
      const query = db.prepare('DELETE FROM tracking WHERE ' + 
        'guild_id=@guildId AND channel_id=@channelId AND tracking_type=@trackingType').run({
          guildId: channelData.channel.guildId,
          channelId: channelData.value,
        trackingType: interaction.options._hoistedOptions[1].value
      });
    
      if (query.changes === 1) {
        const content = {
          type: 'Success',
          message: `Alert Type: \`\`${interaction.options._hoistedOptions[1].value} min\`\`\n` +
            `Status: \`\`Disabled\`\`\n` +
            `Channel: \`\`${channelData.channel.name}\`\`\n` +
            `Guild: \`\`${channelData.channel.guild.name}\`\``
        }

        await interaction.reply({
          embeds: [generateEmbed(COMMAND_NAME, content, discordClient)],
          ephemeral: true 
        });
      } else {
        const content = {
          type: 'Error',
          message: 'There are no tracking alerts for these parameters'
        }

        await interaction.reply({
          embeds: [generateEmbed(COMMAND_NAME, content, discordClient)],
          ephemeral: true
        });
      }
    }
  }
};