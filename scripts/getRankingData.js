const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../constants.json');
const { getRankingEvent } = require('../scripts/getEvent');

const trackingChannels = {}

const generateTracking = (data, currentRankingEvent, currentTimestamp, client) => {
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
    leaderboardText += `\`\`${rank} ${name} [${score}]\`\`\n`
  })

  const leaderboardEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${currentRankingEvent.name}`)
    .addField(`<t:${currentTimestamp}:R>`, 
      leaderboardText, false)
    .setTimestamp()
    .setFooter(FOOTER, client.user.displayAvatarURL());

  return leaderboardEmbed;
};

const requestRanking = async (logger, client, currentRankingEvent, api, db, it=0) => {
  const currentTimestamp = Math.floor(Date.now()/1000)

  // Date rounded to nearest hour
  const nearestHour = new Date()
  nearestHour.setHours(nearestHour.getHours() + Math.round(nearestHour.getMinutes()/60));
  nearestHour.setMinutes(0, 0, 0)

  let totalRankings = []

  // Sequential T100 every 2 minutes
  const rankingDataT100 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 1, lowerLimit: 99})
  totalRankings.push.apply(totalRankings, rankingDataT100.rankings)

  const rankingDataT200 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 101, lowerLimit: 99})
  const rankingDataT300 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 201, lowerLimit: 99})
  const rankingDataT400 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 301, lowerLimit: 99})
  const rankingDataT500 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 401, lowerLimit: 99})
  totalRankings.push.apply(totalRankings, rankingDataT200)
  totalRankings.push.apply(totalRankings, rankingDataT300)
  totalRankings.push.apply(totalRankings, rankingDataT400)
  totalRankings.push.apply(totalRankings, rankingDataT500)


  const rankingDataT1000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 1000, lowerLimit: 0})
  const rankingDataT2000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 2000, lowerLimit: 0})
  const rankingDataT3000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 3000, lowerLimit: 0})
  const rankingDataT4000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 4000, lowerLimit: 0})
  const rankingDataT5000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 5000, lowerLimit: 0})
  totalRankings.push.apply(totalRankings, rankingDataT1000)
  totalRankings.push.apply(totalRankings, rankingDataT2000)
  totalRankings.push.apply(totalRankings, rankingDataT3000)
  totalRankings.push.apply(totalRankings, rankingDataT4000)
  totalRankings.push.apply(totalRankings, rankingDataT5000)

  const rankingDataT10000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 10000, lowerLimit: 0})
  const rankingDataT20000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 20000, lowerLimit: 0})
  const rankingDataT30000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 30000, lowerLimit: 0})
  const rankingDataT40000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 40000, lowerLimit: 0})
  const rankingDataT50000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 50000, lowerLimit: 0})
  const rankingDataT100000 = await api.eventRanking(currentRankingEvent.id, 
    {targetRank: 100000, lowerLimit: 0})
  totalRankings.push.apply(totalRankings, rankingDataT10000)
  totalRankings.push.apply(totalRankings, rankingDataT20000)
  totalRankings.push.apply(totalRankings, rankingDataT30000)
  totalRankings.push.apply(totalRankings, rankingDataT40000)
  totalRankings.push.apply(totalRankings, rankingDataT50000)
  totalRankings.push.apply(totalRankings, rankingDataT100000)

  totalRankings.forEach((user) => {
    db.prepare('INSERT INTO events (event_id, sekai_id, name, rank, score, timestamp) ' + 
      'VALUES(@eventId,	@sekaiId, @name, @rank, @score, @timestamp)').run({
      eventId: currentRankingEvent.id,
      sekaiId: user.userId.toString(),
      name: user.name,
      rank: user.rank,
      score: user.score,
      timestamp: currentTimestamp
    });
  });

  if (totalRankings.length > 0) {
    const tracking = await db.prepare('SELECT * FROM tracking').all()
    const trackingEmbed = generateTracking(totalRankings.slice(0, 10), currentRankingEvent, currentTimestamp, client)
    tracking.forEach(async (target) => {
      if (target.tracking_type == 2) {
        if (target.channel_id in trackingChannels) {
          trackingChannels[target.channel_id].edit({ embeds: [trackingEmbed] });
        } else {
          const channel = client.channels.cache.get(target.channel_id);
          trackingChannels[target.channel_id] = await channel.send({ embeds: [trackingEmbed], fetchReply: true });
        }
      } else {
        if (Math.abs(Math.floor(nearestHour.getTime()/1000) - currentTimestamp) <= 60) {
          if (target.channel_id in trackingChannels) {
            trackingChannels[target.channel_id].edit({ embeds: [trackingEmbed] });
          } else {
            const channel = client.channels.cache.get(target.channel_id);
            trackingChannels[target.channel_id] = await channel.send({ embeds: [trackingEmbed], fetchReply: true });
          }
        }
      }
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
  nextCheck.setMinutes(nextCheck.getMinutes() + Math.round(nextCheck.getSeconds()/60));
  nextCheck.setSeconds(0, 0)

  if (nextCheck.getMinutes() % 2 !== 0) {
    nextCheck.setMinutes(nextCheck.getMinutes() + 1);
  } else {
    nextCheck.setMinutes(nextCheck.getMinutes() + 2);
  }
  return nextCheck.getTime() - Date.now();
}

const getRankingData = async (logger, client, api, db, it=0) => {
  // Identify current event from schedule
  const currentRankingEvent = getRankingEvent()

  // change later back to correct === -1
  if (currentRankingEvent.id === -1) {
    let eta_ms = getNextCheck()
    console.log(`No Current Ranking Event Active, Pausing For ${eta_ms} ms`);
    setTimeout(() => {getRankingData(logger, client, api, db)}, eta_ms);
  } else {
    await requestRanking(logger, client, currentRankingEvent, api, db, it)
    let eta_ms = getNextCheck()
    console.log(`Event Scores Retrieved, Pausing For ${eta_ms} ms`);
    setTimeout(() => {getRankingData(logger, client, api, db, it+1)}, eta_ms);
  }
};

module.exports = getRankingData;