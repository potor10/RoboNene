/**
 * @fileoverview Removes all commands from a bot on a specific server on discord
 * @author Potor10
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId } = require('../config.json');

// Place your guild ids here
const guildId = '811492424626208798';

// Register the slash commands with Discord
const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
  .then(async (data) => {
    for (const command of data) {
      const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
      await rest.delete(deleteUrl);
      console.log(`deleted ${command.name} at ${deleteUrl}`)
    }
});