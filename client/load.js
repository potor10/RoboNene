const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId } = require('../config.json');
const fs = require('fs');
const path = require('path'); 

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, '/commands')).filter(file => file.endsWith('.js'));

// Parse commands
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
  console.log(`Loaded command ${command.data.name} from ${file}`);
	commands.push(command);
}

// Register the slash commands with Discord
const rest = new REST({ version: '9' }).setToken(token);
(async () => {
	try {
    commandNames = commands.map(c => c.data.name);
		console.log(`Started refreshing application (/) commands: ${commandNames}`);

    // Global
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands.map(c => c.data.toJSON()) },
    );

		console.log(`Successfully reloaded application (/) commands: ${commandNames}`);
	} catch (error) {
		console.error(error);
	}
})();