/**
 * @fileoverview The main code to run when you start the bot
 * @author Potor10
 */

const DiscordClient = require('./client/client');
const loadGameData = require('./scripts/loadGameData');
const loadMusicMeta = require('./scripts/loadMusicMeta');
const trackGameData = require('./scripts/trackGameData');
const trackRankingData = require('./scripts/trackRankingData');

loadMusicMeta(0);
loadGameData(0, async () => {
  const client = new DiscordClient();
  client.loadCommands();
  client.loadEvents();
  client.loadDb();
  client.loadLogger();

  await client.loadSekaiClient();
  await client.runSekaiRequests();
  await client.login();

  // Begin the scripts
  trackGameData(client);
  trackRankingData(client);
});
