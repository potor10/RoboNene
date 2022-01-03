
const { SekaiClient } = require('sekapi');

// Full Imports



// Import Scripts
const getSchedule = require('./scripts/getSchedule');
const getRankingData = require('./scripts/getRankingData');


// Sekai Api Init
const api = new SekaiClient();

// Wait for API to finish before continuing
(async () => {
  await api.login()

  // Begin the scripts
  getRankingData(logger, client, api, db)
  getSchedule(logger, client, db);
})();



// Initialize script to begin scraping data from the event
/**
async function test() {
  
  console.log(await api.login());
  console.log(await api.eventRanking(3, {targetUserId: "162307176541507589", higherLimit: 5, lowerLimit: 5}));
  console.log(await api.userProfile("162307176541507589"))
}
test();
*/