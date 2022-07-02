/**
 * @fileoverview The main code to run when you start the bot
 * @author Potor10
 */

const DiscordClient = require('./client/client')
const loadGameData = require('./scripts/loadGameData');
const loadMusicMeta = require('./scripts/loadMusicMeta')
const trackGameData = require('./scripts/trackGameData');
const trackRankingData = require('./scripts/trackRankingData');


loadGameData(0, async () => {
  loadMusicMeta(0)
  const client = new DiscordClient()
  client.loadCommands()
  client.loadEvents()
  client.loadDb()
  client.loadLogger()

  await client.loadSekaiClient()
  await client.runSekaiRequests()
  await client.login()

  await console.log("Logged In")

  // // Begin the scripts
  // trackGameData(client)
  // trackRankingData(client)
});

console.log("Logged In")