/**
 * @fileoverview Removes all commands from a bot into a global cache on Discord
 * May take a while to update, due to Discord's caching system
 * @author Potor10
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId } = require('../config.json');

// Register the slash commands with Discord
const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationCommands(clientId))
  .then(async (data) => {
    for (const command of data) {
      const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
      await rest.delete(deleteUrl);
      console.log(`deleted ${command.name} at ${deleteUrl}`)
    }
});