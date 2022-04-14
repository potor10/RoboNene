const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, RESULTS_PER_PAGE } = require('../../constants');
const generateRankingText = require('../methods/generateRankingText')
const generateEmbed = require('../methods/generateEmbed') 

const RANK_CONSTANTS = {
  'NO_RESULTS_ERR': {
    type: 'Error',
    message: 'Unable to find the specified player on the ranking leaderboard.'
  },

  'NO_EVENT_ERR': {
    type: 'Error',
    message: "There is currently no event going on",
  },

  'NO_RESPONSE_ERR': {
    type: 'Error',
    message: 'There was no response from the server. ' + 
      '\nPlease wait ~10 minutes after ranking concludes before trying again.',
  },

  'RATE_LIMIT_ERR': {
    type: 'Error', 
    message: 'You have reached the maximum amount of requests to the API. ' + 
      'You have been temporarily rate limited.'
  },

  'HIGHER_LIMIT': (RESULTS_PER_PAGE%2) ? Math.floor(RESULTS_PER_PAGE/2) : Math.floor(RESULTS_PER_PAGE/2)-1,
  'LOWER_LIMIT':  Math.floor(RESULTS_PER_PAGE/2)
};

const getRank = async (commandName, interaction, discordClient, requestParams) => {
  const event = discordClient.getCurrentEvent()

  if (event.id === -1) {
    await interaction.editReply({
      embeds: [
        generateEmbed({
          name: commandName, 
          content: RANK_CONSTANTS.NO_EVENT_ERR, 
          client: discordClient.client
        })
      ]
    });
    return
  }

  if (!discordClient.checkRateLimit(interaction.user.id)) {
    await interaction.editReply({
      embeds: [generateEmbed({
        name: commandName,
        content: { 
          type: RATE_LIMIT_ERR.type, 
          message: RATE_LIMIT_ERR.message + 
            `\n\nExpires: <t:${Math.floor(discordClient.getRateLimitRemoval(interaction.user.id) / 1000)}>`
        },
        client: discordClient.client
      })]
    })

    return
  }

  discordClient.addSekaiRequest('ranking', {
    eventId: event.id,
    ...requestParams
  }, async (response) => {

    // Check if the response is valid
    if (!response.rankings) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: commandName, 
            content: RANK_CONSTANTS.NO_RESPONSE_ERR, 
            client: discordClient.client
          })
        ]
      });
      return
    } else if (response.rankings.length === 0) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: commandName, 
            content: RANK_CONSTANTS.NO_RESULTS_ERR, 
            client: discordClient.client
          })
        ]
      });
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
        .addField(`**Requested:** <t:${Math.floor(timestamp/1000)}:R>`, leaderboardText, false)
        .setThumbnail(event.banner)
        .setTimestamp()
        .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());
  
      await interaction.editReply({ 
        embeds: [leaderboardEmbed]
      });
    }, async (err) => {
      // Log the error
      discordClient.logger.log({
        level: 'error',
        timestamp: Date.now(),
        message: err.toString()
      })

      await interaction.editReply({
        embeds: [generateEmbed({
          name: commandName,
          content: { type: 'error', message: err.toString() },
          client: discordClient.client
        })]
      })
    })
  }, async (err) => {
    // Log the error
    discordClient.logger.log({
      level: 'error',
      timestamp: Date.now(),
      message: err.toString()
    })

    await interaction.editReply({
      embeds: [generateEmbed({
        name: commandName,
        content: { type: 'error', message: err.toString() },
        client: discordClient.client
      })]
    })
  })
}

module.exports = getRank