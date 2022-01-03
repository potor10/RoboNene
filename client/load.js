const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./config.json');
const fs = require('fs');

// Place your client and guild ids here
const clientId = '925617020265984071';
const guildId = '811492424626208798';

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands.map(c => c.data.toJSON()) },
		);

		console.log(`Successfully reloaded application (/) commands: ${commandNames}`);
	} catch (error) {
		console.error(error);
	}
})();