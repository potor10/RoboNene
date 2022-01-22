// Import 
const DiscordClient = require('./client/client')
const trackGameData = require('./scripts/trackGameData');
const trackRankingData = require('./scripts/trackRankingData');
const trackRankingRate = require('./scripts/trackRankingRate');

(async () => {
  const client = new DiscordClient()
  client.loadCommands()
  client.loadEvents()
  client.loadDb()
  client.loadLogger()

  await client.loadSekaiClient()
  await client.runSekaiRequests()
  await client.login()

  // Begin the scripts
  trackGameData(client)
  trackRankingData(client)
  trackRankingRate()
})();