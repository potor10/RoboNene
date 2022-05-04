/**
 * @fileoverview Event handler that is run whenever the bot is removed from a guild
 * Updates the bot's status to reflect that it has left a server
 * @author Potor10
 */

const { BOT_ACTIVITY } = require('../../constants');

module.exports = {
  name: 'guildDelete',
  execute(guild, discordClient) {
    discordClient.logger.log({
      level: 'info',
      guild_id: guild.id,
      guild_name: guild.name,
      timestamp: Date.now(),
      message: `Removed From ${guild.name} (id: ${guild.id})`
    });

    const client = discordClient.client
    client.user.setActivity(BOT_ACTIVITY() + 
      `${client.guilds.cache.size} ${(client.guilds.cache.size > 1) ? 'servers' : 'server'}`);
  }
};