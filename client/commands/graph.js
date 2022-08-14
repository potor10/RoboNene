/**
 * @fileoverview Display a graph of the previous ranking trend
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const https = require('https');

const COMMAND = require('../command_data/graph')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

/**
 * Create a graph embed to be sent to the discord interaction
 * @param {string} graphUrl url of the graph we are trying to embed
 * @param {Integer} tier the ranking that the user wants to find
 * @param {DiscordClient} client we are using to interact with discord
 * @return {MessageEmbed} graph embed to be used as a reply via interaction
 */
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

/**
 * Operates on a http request and returns the url embed of the graph using quickchart.io
 * @param {Object} interaction object provided via discord
 * @param {Integer} tier the ranking that the user wants to find
 * @param {Object} rankData the ranking data obtained
 * @param {DiscordClient} client we are using to interact with discord
 * @error Status code of the http request
 */
const postQuickChart = async (interaction, tier, rankData, discordClient) => {
  if (!rankData) {
    await interaction.editReply({
      embeds: [
        generateEmbed({
          name: COMMAND.INFO.name, 
          content: COMMAND.CONSTANTS.NO_DATA_ERR, 
          client: discordClient.client
        })
      ]
    });
    return
  }

  graphData = []

  rankData.forEach(point => {
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
          await interaction.editReply({ 
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
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })
    
    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.NO_EVENT_ERR, 
            client: discordClient.client
          })
        ]
      });
      return
    }

    const tier = interaction.options._hoistedOptions[0].value

    const options = {
      host: COMMAND.CONSTANTS.SEKAI_BEST_HOST,
      path: `/event/${event.id}/rankings/graph?rank=${tier}&region=en`,
      headers: {'User-Agent': 'request'},
      timeout: 500
    };
  
    const request = https.request(options, (res) => {
      let json = '';
      res.on('data', (chunk) => {
        json += chunk;
      });
      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            const rankData = JSON.parse(json);
            postQuickChart(interaction, tier, rankData.data.eventRankings, discordClient);
          } catch (err) {
            // Error parsing JSON: ${err}`
          }
        } else {
          // Error retrieving via HTTPS. Status: ${res.statusCode}
        }
      });
    }).on('error', (err) => {});
    request.setTimeout(500, () => {
      try {
        let cutoffs = discordClient.cutoffdb.prepare('SELECT * FROM cutoffs ' +
          'WHERE (EventID=@eventID AND Tier=@tier)').all({
            eventID: event.id,
            tier: tier
          });
        let rankData = cutoffs.map(x => ({timestamp: x.Timestamp, score: x.Score}));
        console.log(rankData);
        postQuickChart(interaction, tier, rankData, discordClient);
      } catch (err) {
        // Error parsing JSON: ${err}`
      }
    });
  }
};