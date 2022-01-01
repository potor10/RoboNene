const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../constants.json');
const { getRankingEvent } = require('../scripts/getEvent');

const generateTracking = (data, client) => {
  console.log(data.length)

  let maxRankLength = 0
  let maxNameLength = 0
  let maxScoreLength = 0

  data.forEach((user) => {
    if (user.rank.toString().length > maxRankLength) {
      maxRankLength = user.rank.toString().length
    }
    if (user.name.length > maxNameLength) {
      maxNameLength = user.name.length
    }
    if (user.score.toString().length > maxScoreLength) {
      maxScoreLength = user.score.toString().length
    }
  })

  let leaderboardText = '';
  data.forEach((user) => {
    let rank = " ".repeat(maxRankLength - user.rank.toString().length) + user.rank
    let name = " ".repeat(maxNameLength - user.name.length) + user.name
    let score = " ".repeat(maxScoreLength - user.score.toString().length) + user.score
    leaderboardText += `\`${rank} ${name} [${score}]\`\n`
  })

  const leaderboardEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${'event name'} Leaderboard`)
    .addField('T100 Leaderboard', leaderboardText, false)
    .setTimestamp()
    .setFooter(FOOTER, client.user.displayAvatarURL());

  return leaderboardEmbed;
};

const requestRanking = async (logger, client, api, db, it=0) => {
  const currentTimestamp = Math.floor(Date.now()/1000)
  const currentDate = new Date()

  let totalRankings = []

  // Updated every 2 minutes
  console.log(currentDate.getMinutes())
  console.log(currentDate.getMinutes() % 2 == 0)

  // Chronological T100 on every even minute
  const rankingDataT100 = await api.eventRanking(3, {targetRank: 1, lowerLimit: 99})
  totalRankings.push.apply(totalRankings, rankingDataT100.rankings)

  // Updated every 6 minutes
  if (it % 3 === 0) {
    const rankingDataT200 = await api.eventRanking(3, {targetRank: 200, lowerLimit: 0})
    const rankingDataT300 = await api.eventRanking(3, {targetRank: 300, lowerLimit: 0})
    const rankingDataT400 = await api.eventRanking(3, {targetRank: 400, lowerLimit: 0})
    const rankingDataT500 = await api.eventRanking(3, {targetRank: 500, lowerLimit: 0})
    totalRankings.push(rankingDataT200.rankings[0])
    totalRankings.push(rankingDataT300.rankings[0])
    totalRankings.push(rankingDataT400.rankings[0])
    totalRankings.push(rankingDataT500.rankings[0])
  }

  // Updated every 12 minutes
  if (it % 6 === 0) {
    const rankingDataT1000 = await api.eventRanking(3, {targetRank: 1000, lowerLimit: 0})
    const rankingDataT2000 = await api.eventRanking(3, {targetRank: 2000, lowerLimit: 0})
    const rankingDataT3000 = await api.eventRanking(3, {targetRank: 3000, lowerLimit: 0})
    const rankingDataT4000 = await api.eventRanking(3, {targetRank: 4000, lowerLimit: 0})
    const rankingDataT5000 = await api.eventRanking(3, {targetRank: 5000, lowerLimit: 0})
    totalRankings.push(rankingDataT1000.rankings[0])
    totalRankings.push(rankingDataT2000.rankings[0])
    totalRankings.push(rankingDataT3000.rankings[0])
    totalRankings.push(rankingDataT4000.rankings[0])
    totalRankings.push(rankingDataT5000.rankings[0])
  }

  // Updated every 30 minutes
  if (it % 15 === 0) {
    const rankingDataT10000 = await api.eventRanking(3, {targetRank: 10000, lowerLimit: 0})
    const rankingDataT20000 = await api.eventRanking(3, {targetRank: 20000, lowerLimit: 0})
    const rankingDataT30000 = await api.eventRanking(3, {targetRank: 30000, lowerLimit: 0})
    const rankingDataT40000 = await api.eventRanking(3, {targetRank: 40000, lowerLimit: 0})
    const rankingDataT50000 = await api.eventRanking(3, {targetRank: 50000, lowerLimit: 0})
    const rankingDataT100000 = await api.eventRanking(3, {targetRank: 100000, lowerLimit: 0})
    totalRankings.push(rankingDataT10000.rankings[0])
    totalRankings.push(rankingDataT20000.rankings[0])
    totalRankings.push(rankingDataT30000.rankings[0])
    totalRankings.push(rankingDataT40000.rankings[0])
    totalRankings.push(rankingDataT50000.rankings[0])
    totalRankings.push(rankingDataT100000.rankings[0])
  }

  totalRankings.forEach((user) => {
    db.prepare('INSERT INTO events (event_id, sekai_id, name, rank, score, timestamp) ' + 
      'VALUES(@eventId,	@sekaiId, @name, @rank, @score, @timestamp)').run({
      eventId: currentEvent,
      sekaiId: user.userId.toString(),
      name: user.name,
      rank: user.rank,
      score: user.score,
      timestamp: currentTimestamp
    });
  });

  if (totalRankings.length > 0) {
    const tracking = await db.prepare('SELECT * FROM tracking').all()
    const trackingEmbed = generateTracking(totalRankings.slice(0, 10), client)
    tracking.forEach((target) => {
      const channel = client.channels.cache.get(target.channel_id);
      channel.send({ embeds: [trackingEmbed] });
    })
  }

  logger.log({
    level: 'info',
    message: 'Retrieved event data',
    timestamp: Date.now()
  });
}

const getNextCheck = () => {
  const nextCheck = new Date();
  nextCheck.setUTCMilliseconds(0);
  nextCheck.setUTCSeconds(0);

  if (nextCheck.getMinutes() % 2 !== 0) {
    nextCheck.setMinutes(nextCheck.getMinutes() + 1);
  } else {
    nextCheck.setMinutes(nextCheck.getMinutes() + 2);
  }
  return nextCheck.getTime() - Date.now();
}

const getRankingData = async (logger, client, api, db, it=0) => {
  // Identify current event from schedule
  const currentEvent = getRankingEvent()
  if (currentEvent != -1) {
    let eta_ms = getNextCheck()
    console.log(`No Current Ranking Event Active, Pausing For ${eta_ms} ms`);
    setTimeout(() => {getRankingData(logger, client, api, db)}, eta_ms);
  } else {
    await requestRanking(logger, client, api, db, it)
    let eta_ms = getNextCheck()
    console.log(`Event Scores Retrieved, Pausing For ${eta_ms} ms`);
    setTimeout(() => {getRankingData(logger, client, api, db, it+1)}, eta_ms);
  }
};

module.exports = getRankingData;