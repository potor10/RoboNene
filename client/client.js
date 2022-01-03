const { token } = require('./config.json');
const { Client, Intents, Guild } = require('discord.js');

const winston = require('winston');
const Database = require('better-sqlite3');

const fs = require('fs');

class DiscordClient {
  constructor(tk = token) {
    this.token = tk;
    this.commands = [];
    this.logger = null;
    this.db = null;
    this.client = new Client({ 
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
  }

  loadCommands(dir = "./commands") {
    // Parse commands
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`${dir}/${file}`);
      console.log(`Loaded command ${command.data.name} from ${file}`);
      this.commands.push(command);
    }
  }

  loadEvents(dir = "./events") {
    // Parse events
    const eventFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const event = require(`${dir}/${file}`);
      if (event.once) {
        this.client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args, {
          client: this.client,
          commands: this.commands, 
          db: this.db, 
          logger: this.logger, 
          api: this.api
        }));
      }
    }
  }

  loadLogger(dir = '../logs') {
    // Winston logger initialization
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'user-service' },
      transports: [
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        new winston.transports.File({ filename: `${dir}/error.log`, level: 'error' }),
        new winston.transports.File({ filename: `${dir}/combined.log` }),
      ],
    });
  }

  loadDb(dir = '../databases') {
    this.db = new Database(src);
    this.db.prepare('CREATE TABLE IF NOT EXISTS users ' + 
    '(discord_id TEXT PRIMARY KEY, sekai_id TEXT, ' + 
    'rank_warning INTEGER DEFAULT 0, rank_lost INTEGER DEFAULT 0, ' + 
    'event_time INTEGER DEFAULT 0)').run();

    // Initialize the event database instance
    this.db.prepare('CREATE TABLE IF NOT EXISTS events ' + 
      '(event_id INTEGER, sekai_id TEXT, name TEXT, ' + 
      'rank INTEGER, score INTEGER, timestamp INTEGER)').run();

    // Initialize the tracking database instance
    this.db.prepare('CREATE TABLE IF NOT EXISTS tracking ' + 
      '(guild_id TEXT, channel_id TEXT, tracking_type INTEGER)').run();
  }

  async login() {
    await client.login(this.token);
  }
}

module.exports = DiscordClient