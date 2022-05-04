/**
 * @fileoverview The main output when users call for the /tracking command
 * Enables or disables 2-minute or 1-hour tracking for a specific channel within the server
 * @author Potor10
 */

const COMMAND = require('../command_data/tracking')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })

    const db = discordClient.db

    const channelData = interaction.options._hoistedOptions[0]

    if (channelData.channel.type !== 'GUILD_TEXT') {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.INVALID_CHANNEL_ERR, 
            client: discordClient.client
          })
        ]
      });

      return
    }

    if (interaction.options._hoistedOptions[2].value) {
      const perms = channelData.channel.guild.me.permissionsIn(channelData.channel)
      if (!perms.has('SEND_MESSAGES') || !perms.has('EMBED_LINKS')) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.NO_PERMISSIONS_ERR, 
              client: discordClient.client
            })
          ]
        });
        return
      }

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
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: content, 
            client: discordClient.client
          })
        ]
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
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: content, 
              client: discordClient.client
            })
          ]
        });
      } else {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.NO_TRACKING_ERR, 
              client: discordClient.client
            })
          ]
        });
      }
    }
  }
};