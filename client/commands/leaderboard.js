const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants.json');
const { getEvent } = require('../../scripts/getEvent');

const LEADERBOARD_CONSTANTS = {
  'RESULTS_PER_PAGE': 10,
  'NO_EVENT_ERR': 'There is currently no event going on',
  'BAD_RANGE_ERR': 'Error! Please choose a rank within the range of 1 to 100',

  'LEFT': '⬅️',
  'RIGHT': '➡️'
};

const generateLeaderboard = (leaderboardParams) => {
  const start = leaderboardParams.page * LEADERBOARD_CONSTANTS.RESULTS_PER_PAGE;
  const end = start + LEADERBOARD_CONSTANTS.RESULTS_PER_PAGE;

  let maxRankLength = 0
  let maxNameLength = 0
  let maxScoreLength = 0

  for (i = start; i < end; i++) {
    if (leaderboardParams.rankingData[i].rank.toString().length > maxRankLength) {
      maxRankLength = leaderboardParams.rankingData[i].rank.toString().length
    }
    if (leaderboardParams.rankingData[i].name.length > maxNameLength) {
      maxNameLength = leaderboardParams.rankingData[i].name.length
    }
    if (leaderboardParams.rankingData[i].score.toString().length > maxScoreLength) {
      maxScoreLength = leaderboardParams.rankingData[i].score.toString().length
    }
  }

  let leaderboardText = '';
  for (i = start; i < end; i++) {
    let rank = " ".repeat(maxRankLength - 
      leaderboardParams.rankingData[i].rank.toString().length) + 
      leaderboardParams.rankingData[i].rank
    let name = " ".repeat(maxNameLength - 
      leaderboardParams.rankingData[i].name.length) + 
      leaderboardParams.rankingData[i].name
    let score = " ".repeat(maxScoreLength - 
      leaderboardParams.rankingData[i].score.toString().length) + 
      leaderboardParams.rankingData[i].score
    
    leaderboardText += `\`\`${rank} ${name} [${score}]\`\``;
    if (i + 1 === leaderboardParams.target) {
      leaderboardText += '⭐';
    } 
    leaderboardText += '\n';
  }

  const leaderboardEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${leaderboardParams.currentEvent.name}`)
    .setDescription('T100 Leaderboard')
    .addField(`Page ${leaderboardParams.page+1}`, leaderboardText, false)
    .setTimestamp()
    .setFooter(FOOTER, leaderboardParams.client.user.displayAvatarURL());

  return leaderboardEmbed;
};

const awaitReactions = (interaction, message, leaderboardParams) => {
  let availableReactions = [];
  const filter = (reaction, user) => {
    if (leaderboardParams.page === 0) {
      availableReactions = [LEADERBOARD_CONSTANTS.RIGHT];
    } else if (leaderboardParams.page === 
      Math.floor(99 / LEADERBOARD_CONSTANTS.RESULTS_PER_PAGE)) {
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
        await message.edit({ embeds: [generateLeaderboard(leaderboardParams)] });
        awaitReactions(interaction, message, leaderboardParams);
      } else if (reaction.emoji.name === LEADERBOARD_CONSTANTS.RIGHT) {
        leaderboardParams.page += 1
        await message.edit({ embeds: [generateLeaderboard(leaderboardParams)] });
        awaitReactions(interaction, message, leaderboardParams);
      }
    })
    .catch(collected => {});
};

const createLeaderboard = async (interaction, leaderboardParams) => {
  const message = await interaction.reply({ 
    embeds: [generateLeaderboard(leaderboardParams)], fetchReply: true  
  });

  message.react(LEADERBOARD_CONSTANTS.LEFT)
    .then(() => message.react(LEADERBOARD_CONSTANTS.RIGHT))
    .catch(err => console.log(err));

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

  async execute(interaction, commandParams) {
    const currentEvent = getEvent()
    if (currentEvent.id === -1) {
      await interaction.reply({
        content: LEADERBOARD_CONSTANTS.NO_EVENT_ERR,
        ephemeral: true 
      });
      return
    }

    const rankingData = (await commandParams.api.eventRanking(currentEvent.id, 
      {targetRank: 1, lowerLimit: 99})).rankings

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
          const page = Math.floor((target - 1) / LEADERBOARD_CONSTANTS.RESULTS_PER_PAGE);
          
          createLeaderboard(interaction, {
            client: commandParams.client,
            currentEvent: currentEvent,
            rankingData: rankingData, 
            page: page, 
            target: target
          }); 
        }
    } else {
      // User has not selected a specific rank to jump to
      createLeaderboard(interaction, {
        client: commandParams.client,
        currentEvent: currentEvent,
        rankingData: rankingData, 
        page: 0, 
        target: 0
      });
    }
  }
};