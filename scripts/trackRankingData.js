const { MessageEmbed } = require('discord.js');
const { RESULTS_PER_PAGE, NENE_COLOR, FOOTER } = require('../constants');
const RANKING_RANGE = require('./rankingRange.json')
const fs = require('fs');
const generateRankingText = require('../client/methods/generateRankingText')


const trackingChannels = {}

const sendTrackingEmbed = async (data, event, timestamp, discordClient) => {
  const generateTrackingEmbed = () => {
    let leaderboardText = generateRankingText(data.slice(0, RESULTS_PER_PAGE), 0, 0)
  
    const leaderboardEmbed = new MessageEmbed()
      .setColor(NENE_COLOR)
      .setTitle(`${event.name}`)
      .addField(`<t:${Math.floor(timestamp/1000)}:R>`, 
        leaderboardText, false)
      .setTimestamp()
      .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());
  
    return leaderboardEmbed;
  };
  
  const send = async (target, embed) => {
    if (target.channel_id in trackingChannels) {
      trackingChannels[target.channel_id].edit({ 
        embeds: [embed] 
      });
    } else {
      const channel = discordClient.client.channels.cache.get(target.channel_id);
      trackingChannels[target.channel_id] = await channel.send({ 
        embeds: [embed], 
        fetchReply: true 
      });
    }
  }

  if (data.length > 0) {
    const tracking = await discordClient.db.prepare('SELECT * FROM tracking').all()
    const trackingEmbed = generateTrackingEmbed()

    tracking.forEach(async (target) => {
      if (target.tracking_type == 2) {
        send(target, trackingEmbed)
      } else {
        const nearestHour = new Date(timestamp)
        nearestHour.setHours(nearestHour.getHours() + Math.round(nearestHour.getMinutes()/60));
        nearestHour.setMinutes(0, 0, 0)
    
        if (Math.abs(Math.floor(nearestHour.getTime()/1000) - currentTimestamp) <= 60) {
          send(target, trackingEmbed)
        }
      }
    })
  }
}

/**
 * @name getNextCheck
 * @description identifies the time needed before the next check of data
 * 
 * @return {number} the ms to wait before checking again
 */
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

/**
 * @name requestRanking
 * @description requests the next rank of data recursively
 * @param {Object} event our ranking event data
 * @param {DiscordClient} discordClient the client we are using 
 */
const requestRanking = async (data, event, discordClient, idx) => {
  const retrieveResult = (response) => {
    const timestamp = Date.now()

    if (idx === 0) {
      sendTrackingEmbed(response.rankings, event, timestamp, discordClient)
    }

    data.forEach((user) => {
      discordClient.db.prepare('INSERT INTO events ' + 
        '(event_id, sekai_id, name, rank, score, timestamp) ' + 
        'VALUES(@eventId,	@sekaiId, @name, @rank, @score, @timestamp)').run({
        eventId: event.id,
        sekaiId: user.userId.toString(),
        name: user.name,
        rank: user.rank,
        score: user.score,
        timestamp: timestamp
      });
    });

    data.push.apply(data, response.rankings)
  }

  if (idx < RANKING_RANGE.length) {
    if (idx < 5) {
      // Make Ranks 1-500 Priority Requests (We Need These On Time)
      discordClient.addPrioritySekaiRequest('ranking', {
        eventId: event.id,
        ...RANKING_RANGE[idx]
      }, retrieveResult)
      requestRanking(data, event, discordClient, idx+1)
    } else {
      // Make Cutoffs 1000+ Non Priority
      discordClient.addSekaiRequest('ranking', {
        eventId: event.id,
        ...RANKING_RANGE[idx]
      }, retrieveResult)
      requestRanking(data, event, discordClient, idx+1)
    }
  }
}

/**
 * @name getRankingEvent
 * @description Obtains the current event within the ranking period
 * 
 * @returns {Object} the ranking event information
 */
const getRankingEvent = () => {
  const schedule = JSON.parse(fs.readFileSync('./schedule.json'));
  const currentTime = Date.now()
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].startAt <= currentTime && schedule[i].aggregateAt >= currentTime) {
      return {
        id: schedule[i].id,
        banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' +
          `${schedule[i].assetbundleName}/logo_rip/logo.webp`,
        name: schedule[i].name
      }
    }
  }
  return {
    id: -1,
    banner: '',
    name: ''
  }
}

/**
 * @name trackRankingData
 * @description continaully grabs and updates the ranking data
 * @param {DiscordClient} discordClient the client we are using 
 */
const trackRankingData = async (discordClient) => {
  // Identify current event from schedule
  const event = getRankingEvent()

  // change later back to correct === -1
  if (event.id === -1) {
    let eta_ms = getNextCheck()
    console.log(`No Current Ranking Event Active, Pausing For ${eta_ms} ms`);
    setTimeout(() => {trackRankingData(discordClient)}, eta_ms);
  } else {
    requestRanking([], event, discordClient, 0)
    let eta_ms = getNextCheck()
    console.log(`Event Scores Retrieved, Pausing For ${eta_ms} ms`);
    setTimeout(() => {trackRankingData(discordClient)}, eta_ms);
  }
};

module.exports = trackRankingData;