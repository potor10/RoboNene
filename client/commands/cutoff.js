const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, REPLY_TIMEOUT, 
  TIMEOUT_ERR, NO_EVENT_ERR } = require('../../constants');

const generateCutoffEmbed = (event, timestamp, tier, data, discordClient) => {
  let score = 'N/A'
  let scorePerHourAll = 'N/A'
  let timestamp1H = Date.now()
  let scorePerHour1H = 'N/A'
  let estimatedScore = 'N/A'

  if (data) {
    score = data.score.toLocaleString()

    const msTaken = timestamp - event.startAt
    const msRemain = event.aggregateAt - timestamp
    
    const scorePerMs = data.score / msTaken
    scorePerHourAll = (scorePerMs * 3600000).toLocaleString('en-US', {
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2
    }) + '/h'

    // TODO: BIG BAD, Fix
    const results = discordClient.db.prepare('SELECT * FROM events WHERE ' + 
      'event_id=$eventId AND ' +
      'rank=$rank AND ' + 
      'timestamp>=$timestamp ' + 
      'ORDER BY timestamp ASC').all({
      $eventId: event.id,
      $rank: tier,
      $timestamp: timestamp-3600000
    });

    if (results.length > 0) {
      const closestScore1H = results[0]
      timestamp1H = closestScore1H.timestamp
      const msDifference = timestamp - closestScore1H.timestamp
      const score1HPerMs = (data.score - closestScore1H.score) / msDifference

      scorePerHour1H = (score1HPerMs * 3600000).toLocaleString('en-US', {
        minimumFractionDigits: 0, 
        maximumFractionDigits: 2
      }) + '/h'
    }

    estimatedScore = (msRemain * scorePerMs + data.score).toLocaleString('en-US', {
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2
    })
  }

  const timestampSeconds = Math.floor(timestamp/1000)
  const cutoffEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${event.name} T${tier}`)
    .setDescription(`<t:${timestampSeconds}> - <t:${timestampSeconds}:R>`)
    .addField(`Score`, `\`${score}\``)
    .addField(`Score/h`, `\`${scorePerHourAll}\``)
    .addField(`Score/h From <t:${Math.floor(timestamp1H/1000)}:R>`, `\`${scorePerHour1H}\``)
    .addField(`Estimated Score`, `\`${estimatedScore}\``)
    .addField(`Estimated Score (Smoothing)`, `\`${'N/A'}\``)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return cutoffEmbed;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cutoff')
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
    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await interaction.reply({
        content: NO_EVENT_ERR,
        ephemeral: true 
      });
      return
    }

    let replied = false
    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: interaction.options._hoistedOptions[0].value,
      lowerLimit: 0
    }, async (response) => {
      const timestamp = Date.now()

      if (interaction.replied) {
        return
      }

      let tier = interaction.options._hoistedOptions[0].value
      const cutoffEmbed = generateCutoffEmbed(event, timestamp, tier,
        response.rankings[0], discordClient)

      await interaction.reply({
        embeds: [cutoffEmbed]
      });

      replied = true
    })

    setTimeout(async () => {
      if (!replied) {
        await interaction.reply({
          content: TIMEOUT_ERR,
          ephemeral: true 
        });
      }
    }, REPLY_TIMEOUT)
  }
};