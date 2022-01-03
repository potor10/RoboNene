const { BOT_ACTIVITY } = require('../../constants');

module.exports = {
  name: 'guildDelete',
  execute(guild, discordClient) {
    logger.log({
      level: 'info',
      guild_id: guild.id,
      guild_name: guild.name,
      message: `Removed From ${guild.name} (id: ${guild.id})`
    });

    const client = discordClient.client
    client.user.setActivity(BOT_ACTIVITY + 
      `${client.guilds.cache.size} ${(client.guilds.cache.size > 1) ? 'servers' : 'server'}`);
  }
};