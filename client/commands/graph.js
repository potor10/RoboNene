const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');

const COMMAND = require('./graph.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const generateGraphEmbed = (graphUrl, tier, discordClient) => {
  const graphEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`T${tier} Cutoff Graph`)
    .setDescription(`**Requested:** <t:${Math.floor(Date.now()/1000)}:R>`)
    .setThumbnail(discordClient.client.user.displayAvatarURL())
    .setImage(graphUrl)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return graphEmbed
}

const postQuickChart = async (deferredResponse, tier, rankData, discordClient) => {
  if (!rankData.data.eventRankings) {
    await deferredResponse.edit({
      embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_DATA_ERR, discordClient)]
    });
    return
  }

  graphData = []

  rankData.data.eventRankings.forEach(point => {
    graphData.push({
      x: point.timestamp,
      y: point.score
    })
  });

  postData = JSON.stringify({
    "backgroundColor": "#FFFFFF",
    "format": "png",
    'chart': {
      'type': 'line', 
      'data': {
        'datasets': [{
          'label': `T${tier} cutoff`, 
          "fill": false,
          'data': graphData
        }]
      },
      "options": {
        "scales": {
          "xAxes": [{
            "type": "time",
            "distribution": 'linear',
            "time": {
              "displayFormats": {
                "day": "MMM DD YYYY HH:mm"
              },
              "unit": 'day'
            }
          }]
        }
      }
    }
  })

  const options = {
    host: 'quickchart.io',
    port: 443,
    path: `/chart/create`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`)

    let json = '';
    res.on('data', (chunk) => {
      json += chunk;
    });
    res.on('end', async () => {
      if (res.statusCode === 200) {
        try {
          console.log(JSON.stringify(JSON.parse(json)))
          await deferredResponse.edit({ 
            embeds: [generateGraphEmbed(JSON.parse(json).url, tier, discordClient)]
          })
        } catch (err) {
          // Error parsing JSON: ${err}`
          console.log(`ERROR 1 ${err}`)
        }
      } else {
        // Error retrieving via HTTPS. Status: ${res.statusCode}
        console.log(`Error retrieving via HTTPS ${res.statusCode}}`)
      }
    });
  }).on('error', (err) => {});

  req.write(postData)
  req.end()
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND_NAME, discordClient)],
      fetchReply: true
    })
    
    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND_NAME, COMMAND.CONSTANTS.NO_EVENT_ERR, discordClient)]
      });
      return
    }

    const tier = interaction.options._hoistedOptions[0].value

    const options = {
      host: COMMAND.CONSTANTS.SEKAI_BEST_HOST,
      path: `/event/${event.id}/rankings/graph?rank=${tier}&region=en`,
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
            postQuickChart(deferredResponse, tier, rankData, discordClient)
          } catch (err) {
            // Error parsing JSON: ${err}`
          }
        } else {
          // Error retrieving via HTTPS. Status: ${res.statusCode}
        }
      });
    }).on('error', (err) => {});
  }
};