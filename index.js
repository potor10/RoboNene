// Import 
const DiscordClient = require('./client/client')
const trackGameData = require('./scripts/trackGameData');
const trackRankingData = require('./scripts/trackRankingData');

(async () => {
  const client = new DiscordClient()
  client.loadCommands()
  client.loadEvents()
  client.loadDb()
  client.loadLogger()
  client.loadDb()
  await client.loadSekaiClient()
  await client.runSekaiRequests()
  await client.login()

  // Begin the scripts
  trackGameData(client)
  trackRankingData(client)
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