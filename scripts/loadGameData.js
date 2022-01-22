const { DIR_DATA } = require('../constants');
const https = require('https');
const fs = require('fs');

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

const loadGameData = (idx, callback) => {
  if (idx >= GAME_CONSTANTS.JSON.length) {
    callback()
  } else {
    const filename = GAME_CONSTANTS.JSON[idx]

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
            loadGameData(idx+1, callback)
          } catch (err) {
            // Error parsing JSON: ${err}`
          }
        } else {
          // Error retrieving via HTTPS. Status: ${res.statusCode}
        }
      });
    }).on('error', (err) => {});
  }
}

module.exports = loadGameData;