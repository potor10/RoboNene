const { token } = require('../config.json');
const { Client, Intents, Guild } = require('discord.js');
const { SekaiClient } = require('sekapi');
const https = require('https');

const winston = require('winston');
const Database = require('better-sqlite3');

const fs = require('fs');
const path = require('path');
const { resolve } = require('path');

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
      '(discord_id TEXT PRIMARY KEY, sekai_id TEXT, private INTEGER DEFAULT 1, ' + 
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

  async getSekaiVersion() {
    const options = {
      host: 'play.google.com',
      path: `/store/apps/details?id=com.sega.ColorfulStage.en&hl=en_US&gl=US`,
      headers: {'User-Agent': 'request'}
    };
  
    return new Promise((resolve, reject) => {
      https.get(options, (res) => {
        res.setEncoding('utf8');

        let html = '';
        res.on('data', (chunk) => {
          html += chunk;
        });

        res.on('end', async () => {
          if (res.statusCode === 200) {
            // Html is grabbed
            let gameVersionClassIdx = html.indexOf('Current Version')
            if (gameVersionClassIdx === -1) {
              console.log('There was an issue with finding the current game version!')
              return
            }

            const recursiveSearch = (iter, str) => {
              if (iter !== 0) {
                return recursiveSearch(iter-1, str.slice(str.indexOf('>') + 1))
              } else {
                return str
              }
            }

            let iter = 4
            let gameVersionStr = recursiveSearch(iter, html.slice(gameVersionClassIdx))
            let gameVersion = gameVersionStr.slice(0, gameVersionStr.indexOf('<'))

            console.log(`Found current game version of ${gameVersion}`)
            resolve(gameVersion);
          } else {
            // Error retrieving via HTTPS. Status: ${res.statusCode}
            console.log(`Error retrieving game version via HTTPS. Status: ${res.statusCode}`)
            reject(res.statusCode)
          }
        });
      }).on('error', (err) => {});
    })
  }

  async loadSekaiClient(dir=CLIENT_CONSTANTS.PREFS_DIR) {
    const gameVersion = await this.getSekaiVersion()

    // Parse clients
    const apiPrefs = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of apiPrefs) {
      const playerPrefs = require(`${dir}/${file}`);
      console.log(`Loaded client ${playerPrefs.account_user_id} from ${file}`);

      // Set the new game version
      playerPrefs.app_version = gameVersion;

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
    // Idk do some error handling here to reset the specific client
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
    const events = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
    const currentTime = Date.now()

    for (let i = 0; i < events.length; i++) {
      if (events[i].startAt <= currentTime && events[i].closedAt >= currentTime) {
        return {
          id: events[i].id,
          banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' + 
            `${events[i].assetbundleName}/logo_rip/logo.webp`,
          name: events[i].name,
          startAt: events[i].startAt,
          aggregateAt: events[i].aggregateAt,
          closedAt: events[i].closedAt
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