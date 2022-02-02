const COMMAND = require('./tracking.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: true
    })

    const db = discordClient.db

    const channelData = interaction.options._hoistedOptions[0]
    console.log(channelData)

    if (channelData.channel.type !== 'GUILD_TEXT') {
      const content = {
        type: 'Error',
        message: 'The channel you have selected is not a valid text channel'
      }

      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)],
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

      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)]
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

        await interaction.editReply({
          embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)],
        });
      } else {
        const content = {
          type: 'Error',
          message: 'There are no tracking alerts for these parameters'
        }

        await interaction.editReply({
          embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)]
        });
      }
    }
  }
};