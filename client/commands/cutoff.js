const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const regression = require('regression');

const COMMAND_NAME = 'cutoff'

const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const CUTOFF_CONSTANTS = {
  "NO_EVENT_ERR": {
    type: 'Error',
    message: "There is currently no event going on",
  },

  'NO_DATA_ERR': {
    type: 'Error',
    message: 'Please cloose a different cutoff tier',
  },

  "SEKAI_BEST_HOST": "api.sekai.best"
};

const generateCutoffEmbed = (event, timestamp, tier, score, 
  scorePH, estimateNoSmoothing, estimateSmoothing, lastHourPt, discordClient) => {
  const lastHourPtTimeMs = new Date(lastHourPt.timestamp).getTime()
  const lastHourPtTime = Math.floor(lastHourPtTimeMs / 1000)
  const lastHourPtSpeed = Math.round((score - lastHourPt.score) * 3600000 / (timestamp - lastHourPtTimeMs))

  const cutoffEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`T${tier} Cutoff`)
    .setDescription(`${event.name}`)
    .setThumbnail(event.banner)
    .addField(`**Requested:** <t:${Math.floor(timestamp/1000)}:R>`, '\u200b')
    .addField(`Score`, `\`${score.toLocaleString()}\``)
    .addField(`Avg. Speed (Per Hour)`, `\`${scorePH.toLocaleString()}/h\``)
    .addField(`Avg. Speed From <t:${lastHourPtTime}:R> to <t:${Math.floor(timestamp/1000)}:R> (Per Hour)`, 
      `\`${lastHourPtSpeed.toLocaleString()}/h\``)
    .addField(`Estimated Score`, `\`${estimateNoSmoothing}\``)
    .addField(`Estimated Score (Smoothing)`, `\`${estimateSmoothing}\``)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return cutoffEmbed;
};

const generateCutoff = async (deferredResponse, event, timestamp, tier, score, rankData, discordClient) => {
  const msTaken = timestamp - event.startAt
  const duration = event.aggregateAt - event.startAt

  const scorePH = Math.round(score * 3600000 / msTaken)

  let lastHourPt = (rankData) ? rankData[0] : {
    timestamp: (new Date(timestamp)).toISOString(),
    score: score
  }

  if (rankData.length > 61) {
    lastHourPt = rankData[rankData.length-61]
  }

  let estimateNoSmoothing = 'N/A'
  let estimateSmoothing = 'N/A'

  let oneDayIdx = -1
  let halfDayIdx = -1

  // 24 hours have passed into the event
  for(let i = 0; i < rankData.length; i++) {
    const currentEventTime = (new Date(rankData[i].timestamp)).getTime()
    if (halfDayIdx === -1 && currentEventTime > event.startAt + 43200000) {
      halfDayIdx = i
    }
    if (currentEventTime > event.startAt + 86400000) {
      oneDayIdx = i
      break
    }
  }

  if (oneDayIdx !== -1) {
    const points = []

    // Only get data points past 12 hours
    rankData.slice(halfDayIdx).forEach((point) => {
      points.push([(new Date(point.timestamp)).getTime(), point.score])
    })

    const model = regression.linear(points, {precision: 100});
    estimateNoSmoothing = Math.round(model.predict(event.aggregateAt)[1]).toLocaleString()

    let totalWeight = 0
    let totalTime = 0
    // Grab 1 Estimate Every 60 Minutes For Smoothing
    for(let i = oneDayIdx; i < rankData.length + 60; i += 60) {
      const smoothingPoints = []
      const dataSlice = rankData.slice(halfDayIdx, i)
      dataSlice.forEach((point) => {
        smoothingPoints.push([(new Date(point.timestamp)).getTime(), point.score])
      })

      if (dataSlice.length) {
        const result = regression.linear(smoothingPoints, {precision: 100});
        const estimate = result.predict(event.aggregateAt)[1]
        const amtThrough = ((new Date(dataSlice[dataSlice.length-1].timestamp)).getTime() - event.startAt) / duration

        totalWeight += estimate * Math.pow(amtThrough, 2)
        totalTime += Math.pow(amtThrough, 2)
      }
    }

    estimateSmoothing = Math.round(totalWeight / totalTime).toLocaleString()
  }

  const cutoffEmbed = generateCutoffEmbed(event, timestamp, tier, 
    score, scorePH, estimateNoSmoothing, estimateSmoothing, lastHourPt, discordClient)
  await deferredResponse.edit({
    embeds: [cutoffEmbed]
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Find detailed data about the cutoff data for a certain ranking')
    .addIntegerOption(op =>
      op.setName('tier')
        .setDescription('The tier of the cutoff')
        .setRequired(true)
        .addChoice('t1', 1)
        .addChoice('t2', 2)
        .addChoice('t3', 3)
        .addChoice('t10', 10)
        .addChoice('t20', 20)
        .addChoice('t30', 30)
        .addChoice('t40', 40)
        .addChoice('t50', 50)
        .addChoice('t60', 60)
        .addChoice('t70', 70)
        .addChoice('t80', 80)
        .addChoice('t90', 90)
        .addChoice('t100', 100)
        .addChoice('t200', 200)
        .addChoice('t300', 300)
        .addChoice('t400', 400)
        .addChoice('t500', 500)
        .addChoice('t1000', 1000)
        .addChoice('t2000', 2000)
        .addChoice('t3000', 3000)
        .addChoice('t4000', 4000)
        .addChoice('t5000', 5000)
        .addChoice('t10000', 10000)),
  
  async execute(interaction, discordClient) {
    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND_NAME, discordClient)],
      fetchReply: true
    })

    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND_NAME, CUTOFF_CONSTANTS.NO_EVENT_ERR, discordClient)]
      });
      return
    }

    const tier = interaction.options._hoistedOptions[0].value

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: tier,
      lowerLimit: 0
    }, async (response) => {
      const timestamp = Date.now()
      const score = response.rankings[0].score

      const options = {
        host: CUTOFF_CONSTANTS.SEKAI_BEST_HOST,
        path: `/event/${event.id}/rankings?rank=${tier}&limit=100000&region=en`,
        headers: {'User-Agent': 'request'}
      };
    
      https.get(options, (res) => {
        let json = '';
        res.on('data', (chunk) => {
          json += chunk;
        });
        res.on('end', async () => {
          if (res.statusCode === 200) {
            try {
              const rankData = JSON.parse(json)
              generateCutoff(deferredResponse, event, timestamp, tier, score, rankData.data.eventRankings, discordClient);
            } catch (err) {
              // Error parsing JSON: ${err}`
            }
          } else {
            // Error retrieving via HTTPS. Status: ${res.statusCode}
          }
        });
      }).on('error', (err) => {});
    })
  }
};