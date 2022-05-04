/**
 * @fileoverview The main implementation towards maintaining our bot with up to data information.
 * Will async download data from Sekai.best once in a while when the bot is running
 * @author Potor10
 */

const { DIR_DATA } = require('../constants');
const https = require('https');
const fs = require('fs');

// The location we pull from and data modules we pull 
const GAME_CONSTANTS = {
  "HOST": "raw.githubusercontent.com",
  "PATH": "/Sekai-World/sekai-master-db-en-diff/main/",
  "JSON": [
    "gameCharacters",
    "characterProfiles",
    "areas",
    "areaItems",
    "areaItemLevels",
    "events",
    "eventCards",
    "cards"
  ]
}

/**
 * Downloads all the requested data one by one
 */
const getData = () => {
  GAME_CONSTANTS.JSON.forEach((filename) => {
    const options = {
      host: GAME_CONSTANTS.HOST,
      path: `${GAME_CONSTANTS.PATH}${filename}.json`,
      headers: {'User-Agent': 'request'}
    };
  
    https.get(options, (res) => {
      let json = '';
      res.on('data', (chunk) => {
        json += chunk;
      });
      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            fs.writeFileSync(`${DIR_DATA}/${filename}.json`, JSON.stringify(JSON.parse(json)));
            console.log(`${filename}.json Retrieved`)
          } catch (err) {
            // Error parsing JSON: ${err}`
          }
        } else {
          // Error retrieving via HTTPS. Status: ${res.statusCode}
        }
      });
    }).on('error', (err) => {});
  })
}

/**
 * Enables the tracking of the game database, and requests game data once every two hours
 * @param {DiscordClient} discordClient the client we are using to interact with Discord
 */
const trackGameData = async (discordClient) => {
  // Obtain the game data
  getData();

  console.log('Game Data Requested, Pausing For 2 Hours')
  setTimeout(() => {trackGameData(discordClient)}, 7200000);
}

module.exports = trackGameData;