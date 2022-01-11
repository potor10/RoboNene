const { token } = require('../config.json');
const { Client, Intents, Guild } = require('discord.js');
const { SekaiClient } = require('sekapi');

const winston = require('winston');
const Database = require('better-sqlite3');

const fs = require('fs');
const path = require('path')

const CLIENT_CONSTANTS = {
  "CMD_DIR": path.join(__dirname, '/commands'),
  "EVENT_DIR": path.join(__dirname, '/events'),
  "LOG_DIR": path.join(__dirname, '../logs'),
  "DB_DIR": path.join(__dirname, '../databases'),
  "DB_NAME": "databases.db",

  "PREFS_DIR": path.join(__dirname, '../prefs')
}

class DiscordClient {
  constructor(tk = token) {
    this.token = tk;
    this.commands = [];
    this.logger = null;
    this.db = null;

    this.api = [];
    this.priorityApiQueue = [];
    this.apiQueue = [];

    this.client = new Client({ 
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
  }

  loadCommands(dir=CLIENT_CONSTANTS.CMD_DIR) {
    // Parse commands
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`${dir}/${file}`);
      console.log(`Loaded command ${command.data.name} from ${file}`);
      this.commands.push(command);
    }
  }

  loadEvents(dir=CLIENT_CONSTANTS.EVENT_DIR) {
    // Parse events
    const eventFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const event = require(`${dir}/${file}`);
      if (event.once) {
        this.client.once(event.name, (...args) => event.execute(...args));
      } else {
        this.client.on(event.name, (...args) => event.execute(...args, this));
      }
    }
  }

  loadLogger(dir=CLIENT_CONSTANTS.LOG_DIR) {
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

  loadDb(dir = CLIENT_CONSTANTS.DB_DIR) {
    this.db = new Database(`${dir}/${CLIENT_CONSTANTS.DB_NAME}`);
    this.db.prepare('CREATE TABLE IF NOT EXISTS users ' + 
      '(discord_id TEXT PRIMARY KEY, sekai_id TEXT, ' + 
      'rank_warning INTEGER DEFAULT 0, rank_lost INTEGER DEFAULT 0, ' + 
      'event_time INTEGER DEFAULT 0, ' + 
      'quiz_correct INTEGER DEFAULT 0, quiz_question INTEGER DEFAULT 0)').run()

    // Initialize the event database instance
    this.db.prepare('CREATE TABLE IF NOT EXISTS events ' + 
      '(event_id INTEGER, sekai_id TEXT, name TEXT, ' + 
      'rank INTEGER, score INTEGER, timestamp INTEGER)').run()

    // Initialize the tracking database instance
    this.db.prepare('CREATE TABLE IF NOT EXISTS tracking ' + 
      '(channel_id TEXT PRIMARY KEY, guild_id TEXT, tracking_type INTEGER)').run()
  }

  closeDb() {
    this.db.close()
  }

  async loadSekaiClient(dir=CLIENT_CONSTANTS.PREFS_DIR) {
    // Parse clients
    const apiPrefs = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of apiPrefs) {
      const playerPrefs = require(`${dir}/${file}`);
      console.log(`Loaded client ${playerPrefs.account_user_id} from ${file}`);
      // Sekai Api Init
      const apiClient = new SekaiClient(playerPrefs)
      await apiClient.login()
      this.api.push(apiClient)
    }
  }

  async addSekaiRequest(type, params, callback) {
    this.apiQueue.unshift({
      type: type,
      params: params,
      callback: callback
    })
  }

  async addPrioritySekaiRequest(type, params, callback) {
    this.priorityApiQueue.unshift({
      type: type,
      params: params,
      callback: callback
    })
  }

  async runSekaiRequests(rate=10) {
    const runRequest = async (apiClient, request) => {
      if (request.type === 'profile') {
        const response = await apiClient.userProfile(request.params.userId)
        request.callback(response)
      } else if (request.type === 'ranking') {
        const queryParams = {...request.params}
        delete queryParams.eventId

        const response = await apiClient.eventRanking(request.params.eventId, queryParams)
        request.callback(response)
      }
      runClient(apiClient, rate)
    }

    const runClient = async (apiClient, rate) => {
      // console.log(`prioq: ${this.priorityApiQueue.length}, q: ${this.apiQueue.length}`)
      if (this.priorityApiQueue.length > 0) {
        runRequest(apiClient, this.priorityApiQueue.pop())
      } else if (this.apiQueue.length > 0) {
        runRequest(apiClient, this.apiQueue.pop())
      } else {
        setTimeout(() => {runClient(apiClient, rate)}, rate)
      }
    }

    this.api.forEach((apiClient) => {
      runClient(apiClient, rate)
    })
  }

  getCurrentEvent() {
    const schedule = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
    const currentTime = Date.now()

    for (let i = 0; i < schedule.length; i++) {
      if (schedule[i].startAt <= currentTime && schedule[i].closedAt >= currentTime) {
        return {
          id: schedule[i].id,
          banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' + 
            `${schedule[i].assetbundleName}/logo_rip/logo.webp`,
          name: schedule[i].name,
          startAt: schedule[i].startAt,
          aggregateAt: schedule[i].aggregateAt,
          closedAt: schedule[i].closedAt
        }
      }
    }

    return {
      id: -1,
      banner: '',
      name: ''
    }
  }

  async login() {
    await this.client.login(this.token);
  }
}

module.exports = DiscordClient