const { SlashCommandBuilder } = require('@discordjs/builders');
const https = require('https');

// TODO 
// Update reply to be embed
// Obtain data from api.sekai.best for these calculations

const postQuickChart = (message, event, rankData) => {
  data = []

  let startTime = new Date(event.startAt)
  const endTime = new Date(event.aggregateAt)

  let lastValidIdx = 0

  while (startTime < endTime) {
    let smallestDifference = -1
    let changed = false
    for (let i = lastValidIdx; i < rankData.length; i++) {
      if (rankData[i].timestamp > startTime.getTime() + 120000) {
        break
      } else {
        if (Math.abs(rankData[i].timestamp - startTime.getTime()) < 120000) {
          if (smallestDifference === -1 || Math.abs(rankData.timestamp - startTime.getTime()) < smallestDifference) {
            smallestDifference = Math.abs(rankData.timestamp - startTime.getTime())
            lastValidIdx = i
            changed = true
          }
        }
      }
    }

    if (changed) {
      data.push({
        x: new Date(rankData[lastValidIdx].timestamp),
        y: rankData[lastValidIdx].score
      })
    }
    startTime.setHours(startTime.getHours() + 1)
  }

  MAX_CHART_DATA = 216
  // Grab points closest to each hour

  console.log(data)

  postData = JSON.stringify({
    "backgroundColor": "transparent",
    "format": "png",
    'chart': {
      'type': 'line', 
      'data': {
        'datasets': [{
          'label': 'Tidk cutoff', 
          "fill": false,
          'data': data
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
          await message.edit({ content: JSON.parse(json).url })
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
  data: new SlashCommandBuilder()
    .setName('graph')
    .setDescription('Create a visualization')
    .addSubcommand(sc =>
      sc.setName('cutoff')
        .setDescription('Create a graph of the score at a certain cutoff')
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
            .addChoice('t10000', 10000))),
  
  async execute(interaction, discordClient) {
    const message = await interaction.reply({ content: 'done omegalul', fetchReply: true })
    const event = discordClient.getCurrentEvent()

    switch(interaction.options._subcommand) {
      case 'cutoff':
        const tier = interaction.options._hoistedOptions[0].value

        // Fix this, ugh
        const rankData = discordClient.db.prepare('SELECT * FROM events WHERE ' +
         'event_id=@eventId AND rank=@rank ORDER BY timestamp ASC').all({
            eventId: event.id,
            rank: tier
          })
        postQuickChart(message, event, rankData)
        break
      case 'ranking':

        break
      default:

    }
    
  }
};