/**
 * @fileoverview Event handler that is run whenever the bot starts
 * Updates the bot's status to reflect how many servers it has joined
 * @author Potor10
 */

const { BOT_ACTIVITY } = require('../../constants');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Ready on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users`);
    client.user.setActivity(BOT_ACTIVITY() + 
      `${client.guilds.cache.size} ${(client.guilds.cache.size > 1) ? 'servers' : 'server'}`);
  }
};