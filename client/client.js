/**
 * @fileoverview The main class that handles a majority of the discord.js
 * and project sekai interactions between the command layer & app layer.
 * @author Potor10
 */

const { token, secretKey } = require('../config.json');
const { Client, Intents, Guild } = require('discord.js');
const { SekaiClient } = require('sekapi');
const { RATE_LIMIT } = require('../constants');
const https = require('https');

const winston = require('winston');
const Database = require('better-sqlite3-multiple-ciphers');

const fs = require('fs');
const path = require('path');

const generateEmbed = require('./methods/generateEmbed') 

// Constants used to locate the directories of data
const CLIENT_CONSTANTS = {
  "CMD_DIR": path.join(__dirname, '/commands'),
  "EVENT_DIR": path.join(__dirname, '/events'),
  "LOG_DIR": path.join(__dirname, '../logs'),
  "DB_DIR": path.join(__dirname, '../databases'),
  "DB_NAME": "databases.db",

  "PREFS_DIR": path.join(__dirname, '../prefs')
}

/**
 * A client designed to interface discord.js requests and provide
 * integration into the custom Project Sekai API designed for this project
 */
class DiscordClient {
  constructor(tk = token) {
    this.token = tk;
    this.commands = [];
    this.logger = null;
    this.db = null;

    this.api = [];
    this.priorityApiQueue = [];
    this.apiQueue = [];

    this.rateLimit = {};

    this.client = new Client({ 
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS], partials: ['CHANNEL'] });
  }

  /**
   * Loads the commands code into the bot via a provided directory
   * @param {string} dir the directory containing the code for the commands
   */
  loadCommands(dir=CLIENT_CONSTANTS.CMD_DIR) {
    // Parse commands
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(`${dir}/${file}`);
      console.log(`Loaded command ${command.data.name} from ${file}`);
      this.commands.push(command);
    }
  }

  /**
   * Loads the event handlers into the bot via a provided directory
   * @param {string} dir the directory containing the code for the event handlers
   */
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

  /**
   * Starts the logger designed to query application usage
   * Also, enables capture of errors within the code to be sent to the log
   * file in production.
   * @param {string} dir the directory containing the log files
   */
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

    this.client.on('shardError', error => {
      this.logger.log({
        level: 'error',
        message: `A websocket connection encountered an error: ${error}`
      })
    });

    /* Uncomment this in production
    process.on('unhandledRejection', error => {
      this.logger.log({
        level: 'error',
        message: `Unhandled promise rejection: ${error}`
      })
    });
    */
  }

  /**
   * Initializes the user databases (if it does not already exist) and loads
   * the databases for usage.
   * @param {string} dir the directory containing the encrypted databases
   */
  loadDb(dir = CLIENT_CONSTANTS.DB_DIR) {
    this.db = new Database(`${dir}/${CLIENT_CONSTANTS.DB_NAME}`);

    // Read an encrypted database
    this.db.pragma(`key='${secretKey}'`);

    this.db.prepare('CREATE TABLE IF NOT EXISTS users ' + 
      '(discord_id TEXT PRIMARY KEY, sekai_id TEXT, private INTEGER DEFAULT 1, ' + 
      'quiz_correct INTEGER DEFAULT 0, quiz_question INTEGER DEFAULT 0)').run()

    // Initialize the tracking database instance
    this.db.prepare('CREATE TABLE IF NOT EXISTS tracking ' + 
      '(channel_id TEXT PRIMARY KEY, guild_id TEXT, tracking_type INTEGER)').run()
  }

  /**
   * Closes the databases that have been previously opened
   */
  closeDb() {
    this.db.close()
  }

  /**
   * Starts up the Project Sekai Client used to communicate to the game servers
   * @param {string} dir the directory containing the Project Sekai player data
   */
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

  /**
   * Ensures that the specified user has not exhausted their total amount of queries
   * available through the Project Sekai api.
   * @param {string} userId the ID of the account accessing the client
   * @return {boolean} True if the user is not rate limited, false if they are
   */
  checkRateLimit(userId) {
    if (!(userId in this.rateLimit) || 
      this.rateLimit[userId].timestamp < Date.now()) {
      this.rateLimit[userId] = {
        timestamp: Date.now() + 3600000,
        usage: 0
      }
    }

    console.log(this.rateLimit)
    if (this.rateLimit[userId].usage + 1 > RATE_LIMIT) {
      return false
    } 

    this.rateLimit[userId].usage++
    return true
  }

  /**
   * Obtains the time when a user's rate limit counter will reset
   * @param {string} userId the ID of the account accessing the client
   * @return {Integer} timestamp in epochsecond when the rate limit will reset
   */
  getRateLimitRemoval(userId) {
    return this.rateLimit[userId].timestamp
  }

  /**
   * Adds a standard user request to the Queue of Project Sekai Requests
   * @param {string} type the type of request to be added (profile or ranking)
   * @param {Object} params the parameters provided for the request
   * @param {Function} callback a callback to run on successful query of information
   * @param {Function} error an error function to be run if there was an issue
   */
  async addSekaiRequest(type, params, callback, error) {
    this.apiQueue.unshift({
      type: type,
      params: params,
      callback: callback,
      error: error
    })
  }

  /**
   * Adds a priority request to the Queue of Project Sekai Requests (reserved for bot's tracking feature)
   * @param {string} type the type of request to be added (profile or ranking)
   * @param {Object} params the parameters provided for the request
   * @param {Function} callback a callback to run on successful query of information
   * @param {Function} error an error function to be run if there was an issue
   */
  async addPrioritySekaiRequest(type, params, callback, error) {
    this.priorityApiQueue.unshift({
      type: type,
      params: params,
      callback: callback,
      error: error
    })
  }

  /**
   * Enables the clients to begin async running the requests inside the queue
   * @param {Integer} rate the rate that a Sekai Client will check the queue for a request (if idle)
   */
  async runSekaiRequests(rate=10) {
    const runRequest = async (apiClient, request) => {
      if (request.type === 'profile') {
        const response = await apiClient.userProfile(request.params.userId, request.error)

        // If our response is valid we run the callback
        if (response) {
          request.callback(response)
        }
      } else if (request.type === 'ranking') {
        const queryParams = {...request.params}
        delete queryParams.eventId

        const response = await apiClient.eventRanking(request.params.eventId, queryParams, request.error)

        // If our response is valid we run the callback
        if (response) {
          request.callback(response)
        }
      }
      return runClient(apiClient, rate)
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

  /**
   * Returns data of the event that is currently taking place
   * @return {Object} event data of the event that is currently taking place
   */
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
          closedAt: events[i].closedAt,
          eventType: events[i].eventType
        }
      }
    }

    return {
      id: -1,
      banner: '',
      name: ''
    }
  }

  /**
   * Logs into the Discord Bot using the provided token
   */
  async login() {
    await this.client.login(this.token);
  }
}

module.exports = DiscordClient