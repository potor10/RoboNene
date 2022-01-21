const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, RESULTS_PER_PAGE } = require('../../constants');

const COMMAND = require('./leaderboard.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateRankingText = require('../methods/generateRankingText')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const createLeaderboard = async (deferredResponse, userId, leaderboardParams) => {
  const generateLeaderboardEmbed = ({timestamp, client, event, page, rankingData, target}) => {
    const start = page * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;

    let leaderboardText = generateRankingText(rankingData.slice(start, end), page, target)
  
    const leaderboardEmbed = new MessageEmbed()
      .setColor(NENE_COLOR)
      .setTitle(`${event.name}`)
      .setDescription(`T100 Leaderboard at <t:${Math.floor(timestamp/1000)}>`)
      .addField(`Page ${page+1}`, leaderboardText, false)
      .setThumbnail(event.banner)
      .setTimestamp()
      .setFooter(FOOTER, client.user.displayAvatarURL());
  
    return leaderboardEmbed;
  };
  
  const message = await deferredResponse.edit({ 
    embeds: [generateLeaderboardEmbed(leaderboardParams)], fetchReply: true  
  });

  message.react(COMMAND.CONSTANTS.LEFT)
    .then(() => message.react(COMMAND.CONSTANTS.RIGHT))
    .catch(err => console.log(err));

  const awaitReactions = (userId, message, leaderboardParams) => {
    let availableReactions = [];
    const filter = (reaction, user) => {
      if (leaderboardParams.page === 0) {
        availableReactions = [COMMAND.CONSTANTS.RIGHT];
      } else if (leaderboardParams.page === 
        Math.floor((leaderboardParams.rankingData.length - 1) / RESULTS_PER_PAGE)) {
        availableReactions = [COMMAND.CONSTANTS.LEFT];
      } else {
        availableReactions = [COMMAND.CONSTANTS.LEFT, COMMAND.CONSTANTS.RIGHT];
      }
      return availableReactions.includes(reaction.emoji.name) && user.id === userId;
    };
  
    message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
      .then(async (collected) => {
        const reaction = collected.first();
        if (reaction.emoji.name === COMMAND.CONSTANTS.LEFT) {
          leaderboardParams.page -= 1
          await message.edit({ embeds: [generateLeaderboardEmbed(leaderboardParams)] });
          awaitReactions(userId, message, leaderboardParams);
        } else if (reaction.emoji.name === COMMAND.CONSTANTS.RIGHT) {
          leaderboardParams.page += 1
          await message.edit({ embeds: [generateLeaderboardEmbed(leaderboardParams)] });
          awaitReactions(userId, message, leaderboardParams);
        }
      })
      .catch(collected => {});
  };

  awaitReactions(userId, message, leaderboardParams);
};

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

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: 1,
      lowerLimit: 99
    }, async (response) => {
      // Check if the response is valid
      if (!response.rankings) {
        await deferredResponse.edit({
          embeds: [generateEmbed(commandName, COMMAND.CONSTANTS.NO_RESPONSE_ERR, discordClient)]
        });
        return
      } else if (response.rankings.length === 0) {
        await deferredResponse.edit({
          embeds: [generateEmbed(commandName, COMMAND.CONSTANTS.BAD_INPUT_ERROR, discordClient)]
        });
        return
      }

      const rankingData = response.rankings
      const timestamp = Date.now()

      if (interaction.options._hoistedOptions.length) {
        // User has selected a specific rank to jump to
          if (interaction.options._hoistedOptions[0].value > 100 || 
            interaction.options._hoistedOptions[0].value < 1) {
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_RANGE_ERR, discordClient)]
            });
          } else {
            const target = interaction.options._hoistedOptions[0].value;
            const page = Math.floor((target - 1) / RESULTS_PER_PAGE);
            
            createLeaderboard(deferredResponse, interaction.user.id, {
              timestamp: timestamp,
              client: discordClient.client,
              event: event,
              rankingData: rankingData, 
              page: page, 
              target: target
            }); 
          }
      } else {
        // User has not selected a specific rank to jump to
        createLeaderboard(deferredResponse, interaction.user.id, {
          timestamp: timestamp,
          client: discordClient.client,
          event: event,
          rankingData: rankingData, 
          page: 0, 
          target: 0
        });
      }
    })
  }
};