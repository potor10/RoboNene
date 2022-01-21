const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('../config.json');

// Place your client and guild ids here
const clientId = '925617020265984071';

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