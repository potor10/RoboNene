const { MessageEmbed } = require('discord.js');
const { RESULTS_PER_PAGE, NENE_COLOR, FOOTER } = require('../constants');
const RANKING_RANGE = require('./trackRankingRange.json')
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
    const trackingEmbed = generateTrackingEmbed()

    const channels = discordClient.db.prepare('SELECT * FROM tracking').all()

    channels.forEach(async (channel) => {
      if (channel.tracking_type == 2) {
        send(channel, trackingEmbed)
      } else {
        const nearestHour = new Date(timestamp)
        nearestHour.setHours(nearestHour.getHours() + Math.round(nearestHour.getMinutes()/60));
        nearestHour.setMinutes(0, 0, 0)
    
        if (Math.abs(Math.floor(nearestHour.getTime()/1000) - currentTimestamp) <= 60) {
          send(channel, trackingEmbed)
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
const requestRanking = async (event, discordClient) => {
  const retrieveResult = (response) => {
    const timestamp = Date.now()
    sendTrackingEmbed(response.rankings, event, timestamp, discordClient)
  }

  for(const idx in RANKING_RANGE) {
    // Make Priority Requests (We Need These On Time)
    discordClient.addPrioritySekaiRequest('ranking', {
      eventId: event.id,
      ...RANKING_RANGE[idx]
    }, retrieveResult)
  }
}

/**
 * @name getRankingEvent
 * @description Obtains the current event within the ranking period
 * 
 * @returns {Object} the ranking event information
 */
const getRankingEvent = () => {
  let schedule = {}
  try {
    schedule = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
  } catch (err) {
    return { id: -1, banner: '', name: '' }
  }

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
  return { id: -1, banner: '', name: '' }
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
    // 1 extra second to make sure event is on
    setTimeout(() => {trackRankingData(discordClient)}, eta_ms + 1000);
  } else {
    requestRanking(event, discordClient)
    let eta_ms = getNextCheck()
    console.log(`Event Scores Retrieved, Pausing For ${eta_ms} ms`);
    // 1 extra second to make sure event is on
    setTimeout(() => {trackRankingData(discordClient)}, eta_ms + 1000);
  }
};

module.exports = trackRankingData;