const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, REPLY_TIMEOUT, TIMEOUT_ERR } = require('../../constants.json');

const LEADERBOARD_CONSTANTS = {
  'RESULTS_PER_PAGE': 10,
  'NO_EVENT_ERR': 'There is currently no event going on',
  'BAD_RANGE_ERR': 'Error! Please choose a rank within the range of 1 to 100',

  'LEFT': '⬅️',
  'RIGHT': '➡️'
};

const createLeaderboard = async (interaction, leaderboardParams) => {
  const generateLeaderboardEmbed = () => {
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
        const scoreStrLen = leaderboardParams.rankingData[i].score.toString().length
        const commaAmt = Math.floor(scoreStrLen/3)
        maxScoreLength = scoreStrLen + commaAmt
      }
    }
  
    let leaderboardText = '';
    for (i = start; i < end; i++) {
      let rank = " ".repeat(maxRankLength - 
        leaderboardParams.rankingData[i].rank.toString().length) + 
        leaderboardParams.rankingData[i].rank
      let name = leaderboardParams.rankingData[i].name + 
        " ".repeat(maxNameLength - 
        leaderboardParams.rankingData[i].name.length) 
      let score = " ".repeat(maxScoreLength - 
        leaderboardParams.rankingData[i].score.toString().length) + 
        leaderboardParams.rankingData[i].score.toLocaleString()
      
      leaderboardText += `\`\`${rank} ${name} ${score}\`\``;
      if (i + 1 === leaderboardParams.target) {
        leaderboardText += '⭐';
      } 
      leaderboardText += '\n';
    }
  
    const leaderboardEmbed = new MessageEmbed()
      .setColor(NENE_COLOR)
      .setTitle(`${leaderboardParams.event.name}`)
      .setDescription('T100 Leaderboard')
      .addField(`Page ${leaderboardParams.page+1}`, leaderboardText, false)
      .setTimestamp()
      .setFooter(FOOTER, leaderboardParams.client.user.displayAvatarURL());
  
    return leaderboardEmbed;
  };
  
  const message = await interaction.reply({ 
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
        content: LEADERBOARD_CONSTANTS.NO_EVENT_ERR,
        ephemeral: true 
      });
      return
    }

    let replied = false
    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: 1,
      lowerLimit: 99
    }, async (response) => {
      const rankingData = response.rankings
      const timestamp = Date.now()

      if (interaction.replied) {
        return
      }

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
              client: discordClient.client,
              event: event,
              rankingData: rankingData, 
              page: page, 
              target: target
            }); 
          }
      } else {
        // User has not selected a specific rank to jump to
        createLeaderboard(interaction, {
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