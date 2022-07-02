/**
 * @fileoverview Pulls Music Meta Data from dnaroma.eu/sekai-best-assets
 * Seperate file due to music meta not being hosted on sekai.best
 * @author Ai0796
 */

const { DIR_DATA } = require('../constants');
const https = require('https');
const fs = require('fs');
const loadGameData = require('./loadGameData');

// The location we pull from and data modules we pull 
const GAME_CONSTANTS = {
    "HOST": "minio.dnaroma.eu",
    "PATH": "/sekai-best-assets/",
    "JSON": [
        "music_metas"
    ]
}

/**
 * Recursively downloads the data one by one, then executes a callback to confirm all
 * data has been downloaded
 * @param {Integer} idx the current index on that data we have downloaded
 * @param {Function} callback a callback to run upon the successful download of all data
 */
const loadMusicMeta = (idx) => {
    if (idx >= GAME_CONSTANTS.JSON.length) {
        return
    } else {
        const filename = GAME_CONSTANTS.JSON[idx]

        const options = {
            host: GAME_CONSTANTS.HOST,
            path: `${GAME_CONSTANTS.PATH}${filename}.json`,
            headers: { 'User-Agent': 'request' }
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
                        loadGameData(idx + 1)
                    } catch (err) {
                        console.log(`Error parsing JSON: ${err}`)
                    }
                } else {
                    console.log(`Error retrieving via HTTPS. Status: ${res.statusCode}`)
                }
            });
        }).on('error', (err) => { });
    }
}

module.exports = loadMusicMeta;