const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');
const regression = require('regression');

const COMMAND = require('./cutoff.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

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
    .addField(`Points`, `\`${score.toLocaleString()}\``)
    .addField(`Avg. Speed (Per Hour)`, `\`${scorePH.toLocaleString()}/h\``)
    .addField(`Avg. Speed [<t:${lastHourPtTime}:R> to <t:${Math.floor(timestamp/1000)}:R>] (Per Hour)`, 
      `\`${lastHourPtSpeed.toLocaleString()}/h\``)
    .addField(`Estimated Points`, `\`${estimateNoSmoothing}\``)
    .addField(`Estimated Points (Smoothing)`, `\`${estimateSmoothing}\``)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return cutoffEmbed;
};

const generateCutoff = async (deferredResponse, event, timestamp, tier, score, rankData, discordClient) => {
  if (!rankData.length) {
    await deferredResponse.edit({
      embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_DATA_ERR, discordClient)]
    });
    return
  }

  const msTaken = timestamp - event.startAt
  const duration = event.aggregateAt - event.startAt

  const scorePH = Math.round(score * 3600000 / msTaken)

  let lastHourPt = (rankData) ? rankData[0] : {
    timestamp: (new Date(timestamp)).toISOString(),
    score: score
  }

  if (rankData.length > 60) {
    lastHourPt = rankData[rankData.length-60]
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
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND.INFO.name, discordClient)],
      fetchReply: true
    })

    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_EVENT_ERR, discordClient)]
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
        host: COMMAND.CONSTANTS.SEKAI_BEST_HOST,
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