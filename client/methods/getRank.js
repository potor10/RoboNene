const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, REPLY_TIMEOUT, 
  TIMEOUT_ERR, NO_EVENT_ERR, RESULTS_PER_PAGE } = require('../../constants');
const generateRankingText = require('../methods/generateRankingText')

const RANK_CONSTANTS = {
  'BAD_INPUT_ERROR': 'Error! There was an issue with the input',

  'HIGHER_LIMIT': (RESULTS_PER_PAGE%2) ? Math.floor(RESULTS_PER_PAGE/2) : Math.floor(RESULTS_PER_PAGE/2)-1,
  'LOWER_LIMIT':  Math.floor(RESULTS_PER_PAGE/2)
};

const getRank = async (interaction, discordClient, requestParams) => {
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
    ...requestParams
  }, async (response) => {
    if (interaction.replied) {
      return
    } else if (response.rankings.length === 0) {
      await interaction.reply({
        content: RANK_CONSTANTS.BAD_INPUT_ERROR,
        ephemeral: true 
      });
      replied = true
      return
    }

    let higherLimit = RANK_CONSTANTS.HIGHER_LIMIT
    let lowerLimit = RANK_CONSTANTS.LOWER_LIMIT
    if (response.rankings[0].rank < RANK_CONSTANTS.HIGHER_LIMIT + 1) {
      const diff = RANK_CONSTANTS.HIGHER_LIMIT + 1 - response.rankings[0].rank
      higherLimit -= diff
      lowerLimit += diff
    }

    requestParams.higherLimit = higherLimit
    requestParams.lowerLimit = lowerLimit

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      ...requestParams
    }, async (response) => {
      const timestamp = Date.now()    
  
      let leaderboardText = generateRankingText(response.rankings, 0, requestParams.higherLimit+1)
      const leaderboardEmbed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(`${event.name}`)
        .addField(`<t:${Math.floor(timestamp/1000)}:R>`, 
          leaderboardText, false)
        .setTimestamp()
        .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());
  
      await interaction.reply({ embeds: [leaderboardEmbed] });
  
      replied = true
    })
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

module.exports = getRank