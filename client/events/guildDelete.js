const { BOT_ACTIVITY } = require('../constants.json');

module.exports = {
  name: 'guildDelete',
  requestClient: true,
  execute(guild, client, logger) {
    logger.log({
      level: 'info',
      guild_id: guild.id,
      guild_name: guild.name,
      message: `Removed From ${guild.name} (id: ${guild.id})`
    });
    client.user.setActivity(BOT_ACTIVITY + 
      `${client.guilds.cache.size} ${(client.guilds.cache.size > 1) ? 'servers' : 'server'}`);
  }
};