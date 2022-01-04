const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, RESULTS_PER_PAGE, 
  REPLY_TIMEOUT, TIMEOUT_ERR, NO_EVENT_ERR } = require('../../constants');
const generateRankingText = require('../methods/generateRankingText')

const LEADERBOARD_CONSTANTS = {
  'BAD_RANGE_ERR': 'Error! Please choose a rank within the range of 1 to 100',

  'LEFT': '⬅️',
  'RIGHT': '➡️'
};

const createLeaderboard = async (deferredResponse, interaction, leaderboardParams) => {
  const generateLeaderboardEmbed = ({client, event, page, rankingData, target}) => {
    const start = page * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;

    let leaderboardText = generateRankingText(rankingData.slice(start, end), page, target)
  
    const leaderboardEmbed = new MessageEmbed()
      .setColor(NENE_COLOR)
      .setTitle(`${event.name}`)
      .setDescription('T100 Leaderboard')
      .addField(`Page ${page+1}`, leaderboardText, false)
      .setTimestamp()
      .setFooter(FOOTER, client.user.displayAvatarURL());
  
    return leaderboardEmbed;
  };
  
  const message = await deferredResponse.edit({ 
    content: '',
    embeds: [generateLeaderboardEmbed(leaderboardParams)], fetchReply: true  
  });

  message.react(LEADERBOARD_CONSTANTS.LEFT)
    .then(() => message.react(LEADERBOARD_CONSTANTS.RIGHT))
    .catch(err => console.log(err));


  const awaitReactions = (interaction, message, leaderboardParams) => {
    let availableReactions = [];
    const filter = (reaction, user) => {
      if (leaderboardParams.page === 0) {
        availableReactions = [LEADERBOARD_CONSTANTS.RIGHT];
      } else if (leaderboardParams.page === 
        Math.floor((leaderboardParams.rankingData.length - 1) / RESULTS_PER_PAGE)) {
        availableReactions = [LEADERBOARD_CONSTANTS.LEFT];
      } else {
        availableReactions = [LEADERBOARD_CONSTANTS.LEFT, LEADERBOARD_CONSTANTS.RIGHT];
      }
      return availableReactions.includes(reaction.emoji.name) && user.id === interaction.user.id;
    };
  
    message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
      .then(async (collected) => {
        const reaction = collected.first();
        if (reaction.emoji.name === LEADERBOARD_CONSTANTS.LEFT) {
          leaderboardParams.page -= 1
          await message.edit({ embeds: [generateLeaderboardEmbed(leaderboardParams)] });
          awaitReactions(interaction, message, leaderboardParams);
        } else if (reaction.emoji.name === LEADERBOARD_CONSTANTS.RIGHT) {
          leaderboardParams.page += 1
          await message.edit({ embeds: [generateLeaderboardEmbed(leaderboardParams)] });
          awaitReactions(interaction, message, leaderboardParams);
        }
      })
      .catch(collected => {});
  };

  awaitReactions(interaction, message, leaderboardParams);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top 100 players and their scores')
    .addIntegerOption(op =>
      op.setName('rank')
        .setDescription('Jump to rank')
        .setRequired(false)),

  async execute(interaction, discordClient) {
    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await interaction.reply({
        content: NO_EVENT_ERR,
        ephemeral: true 
      });
      return
    }

    const deferredResponse = await interaction.reply({
      content: TIMEOUT_ERR,
      fetchReply: true
    });

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: 1,
      lowerLimit: 99
    }, async (response) => {
      const rankingData = response.rankings
      const timestamp = Date.now()

      if (interaction.options._hoistedOptions.length > 0) {
        // User has selected a specific rank to jump to
          if (interaction.options._hoistedOptions[0].value > 100 || 
            interaction.options._hoistedOptions[0].value < 1) {
              await interaction.reply({
                content: LEADERBOARD_CONSTANTS.BAD_RANGE_ERR,
                ephemeral: true 
              });
          } else {
            const target = interaction.options._hoistedOptions[0].value;
            const page = Math.floor((target - 1) / RESULTS_PER_PAGE);
            
            createLeaderboard(deferredResponse, interaction, {
              client: discordClient.client,
              event: event,
              rankingData: rankingData, 
              page: page, 
              target: target
            }); 
          }
      } else {
        // User has not selected a specific rank to jump to
        createLeaderboard(deferredResponse, interaction, {
          client: discordClient.client,
          event: event,
          rankingData: rankingData, 
          page: 0, 
          target: 0
        });
      }

      // Save the data to the db
      rankingData.forEach((user) => {
        discordClient.db.prepare('INSERT INTO events ' + 
          '(event_id, sekai_id, name, rank, score, timestamp) ' + 
          'VALUES(@eventId,	@sekaiId, @name, @rank, @score, @timestamp)').run({
          eventId: event.id,
          sekaiId: user.userId.toString(),
          name: user.name,
          rank: user.rank,
          score: user.score,
          timestamp: timestamp
        });
      });
    })
  }
};