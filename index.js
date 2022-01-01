// Partial Imports
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('./config.json');
const { Client, Intents, Guild } = require('discord.js');

// Full Imports
const Database = require('better-sqlite3');
const fs = require('fs');
const winston = require('winston');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

// Place your client and guild ids here
const clientId = '925617020265984071';
const guildId = '811492424626208798';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
  ],
});

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
  console.log(`Loaded command ${command.data.name} from ${file}`);
	commands.push(command);
}

const rest = new REST({ version: '9' }).setToken(token);

// Register the slash commands with Discord
(async () => {
	try {
    commandNames = commands.map(c => c.data.name)
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

// Initialize the user database instance
const db = new Database('./databases/database.db');
db.prepare('CREATE TABLE IF NOT EXISTS users ' + 
  '(discord_id TEXT PRIMARY KEY, sekai_id TEXT, ' + 
  'rank_warning INTEGER DEFAULT 0, rank_lost INTEGER DEFAULT 0, ' + 
  'event_time INTEGER DEFAULT 0)').run()

// Initialize the event database instance
db.prepare('CREATE TABLE IF NOT EXISTS events ' + 
  '(event_id INTEGER, sekai_id TEXT, rank INTEGER, timestamp INTEGER)').run()

// Initialize the tracking database instance
db.prepare('CREATE TABLE IF NOT EXISTS tracking ' + 
  '(guild_id TEXT, channel_id TEXT, tracking_type INTEGER)').run()

// Create a new client instance
const client = new Client({ 
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else if (event.requestClient) {
		client.on(event.name, (...args) => event.execute(...args, client, logger));
	} else {
    client.on(event.name, (...args) => event.execute(...args, commands, db, logger));
  }
}

// Login to Discord with your client's token
client.login(token);