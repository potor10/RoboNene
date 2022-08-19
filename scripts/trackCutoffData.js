/**
 * @fileoverview Main tracker of all cutoff data for internal storage in case Sekai.Best goes down
 * @author Ai0796
 */

const { CUTOFF_INTERVAL, CUTOFF_DATA} = require('../constants');
const fs = require('fs');

//Cutoffs we store
const cutoffs = [
    1,
    2,
    3,
    10,
    20,
    30,
    40,
    50,
    100,
    200,
    300,
    400,
    500,
    1000,
    2000,
    3000,
    4000,
    5000,
    10000,
    20000,
    30000,
    40000,
    50000,
];

/**
 * Writes JSON response from Project Sekai servers to local JSON
 * @param {Object} response from project sekai client
*/



/**
 * Recurvsively adds cutoff tracks to queue
 * @param {Integer} target index of cutoff in a cutoff list
 * @param {Integer} target event, if -1 calculates the event based on current time
 * @param {DiscordClient} discordClient the client we are using 
*/
async function getCutoffs(discordClient) {
    async function logResults(response) {
        try {
            let event = getRankingEvent().id;
            if (response['rankings'][0] != null && event != -1) {
                let score = response['rankings'][0]['score'];
                let rank = response['rankings'][0]['rank'];
                let timestamp = new Date().toISOString();

                discordClient.cutoffdb.prepare('INSERT INTO cutoffs ' +
                    '(EventID, Tier, Timestamp, Score) ' + 
                    'VALUES(@eventID, @tier, @timestamp, @score)').run({
                        score: score,
                        eventID: event,
                        tier: rank,
                        timestamp: timestamp
                    });
            }
        } catch (e) {
            console.log('Error occured while adding cutoffs: ', e);
        }
    }
    try {
        let event = getRankingEvent().id;
        if (event == -1) {
            return -1;
        } else {
            cutoffs.forEach(cutoff => {
                discordClient.addPrioritySekaiRequest('ranking', {
                    eventId: event,
                    targetRank: cutoff,
                    lowerLimit: 0
                }, logResults, (err) => {
                    discordClient.logger.log({
                        level: 'error',
                        message: err.toString()
                    });
                });
            }); 
        }
    } catch (error) {
        console.log(error);
        console.log('Connection Error, Retrying');
        return;
    }
}

/**
 * Obtains the current event within the ranking period
 * @return {Object} the ranking event information
 */
const getRankingEvent = () => {
    const events = JSON.parse(fs.readFileSync('sekai_master/events.json'));
    const currentTime = Date.now();

    for (let i = events.length - 1; i >= 0; i--) {
        //Time of Distribution + buffer time of 15 minutes to get final cutoff
        if (events[i].startAt < currentTime && events[i].aggregateAt > currentTime) {
            return {
                id: events[i].id,
                banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' +
                    `${events[i].assetbundleName}/logo_rip/logo.webp`,
                name: events[i].name,
                startAt: events[i].startAt,
                aggregateAt: events[i].aggregateAt,
                closedAt: events[i].closedAt,
                eventType: events[i].eventType
            };
        }
    }

    return {
        id: -1,
        banner: '',
        name: ''
    };
};

/**
 * Continaully grabs and updates the Cutoff data
 * @param {DiscordClient} discordClient the client we are using 
 */
const trackCutoffData = async (discordClient) => {
    let dataUpdater = setInterval(getCutoffs, CUTOFF_INTERVAL, discordClient);
    getCutoffs(discordClient); //Run function once since setInterval waits an interval to run it
};

module.exports = trackCutoffData;