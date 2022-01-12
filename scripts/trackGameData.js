const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, DIR_DATA } = require('../constants');
const { sekaiDiffHost, sekaiDiffPath, includeJson } = require('../config.json')
const https = require('https');
const fs = require('fs');

const getData = (dir=DIR_DATA) => {
  includeJson.forEach((filename) => {
    const options = {
      host: sekaiDiffHost,
      path: `${sekaiDiffPath}${filename}.json`,
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
            fs.writeFileSync(`${dir}/${filename}.json`, JSON.stringify(JSON.parse(json)));
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

const trackGameData = async (discordClient) => {
  // Obtain the game data
  getData();

  console.log('Ranking Data Retrieved, Pausing For 120000 ms')
  setTimeout(() => {trackGameData(discordClient)}, 120000);
}

module.exports = trackGameData;