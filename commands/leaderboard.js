const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, LEADERBOARD } = require('../constants.json');

const temp_leader = []
for (i = 0; i < 100; i++) {
  temp_leader.push([Math.random()])
}
temp_leader.sort()

const generateLeaderboard = (page, target) => {
  const start = page * LEADERBOARD.RESULTS_PER_PAGE
  const end = start + LEADERBOARD.RESULTS_PER_PAGE

  let leaderboardText = ''
  for (i = start; i < end; i++) {
    let digit = i + 1
    let rankText = ''
    while (digit > 0) {
      rankText = `${LEADERBOARD[digit % 10]}` + rankText;
      digit = Math.floor(digit / 10)
    }

    if (i + 1 === target) {
      leaderboardText += `**${rankText} ${'temp name'} [${temp_leader[i]}]**`
    } else {
      leaderboardText += `${rankText} ${'temp name'} [${temp_leader[i]}]`
    }
    if (i != end - 1) {
      leaderboardText += '\n'
    }
  }

  const leaderboardEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${'event name'} Leaderboard`)
    .setDescription(`Page ${page+1}`)
    .addField('T100 Leaderboard', leaderboardText, false)
    .setTimestamp()
    .setFooter(FOOTER, 'https://i.imgur.com/AfFp7pu.png');

  return leaderboardEmbed
}

const awaitReactions = (interaction, message, page, target) => {
  let availableReactions = []
  const filter = (reaction, user) => {
    if (page === 0) {
      availableReactions = [LEADERBOARD.RIGHT]
    } else if (page === Math.floor(99 / LEADERBOARD.RESULTS_PER_PAGE)) {
      availableReactions = [LEADERBOARD.LEFT]
    } else {
      availableReactions = [LEADERBOARD.LEFT, LEADERBOARD.RIGHT]
    }
    return availableReactions.includes(reaction.emoji.name) && user.id === interaction.user.id;
  };

  message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
    .then(async (collected) => {
      const reaction = collected.first();
      if (reaction.emoji.name === LEADERBOARD.LEFT) {
        await message.edit({ embeds: [generateLeaderboard(page-1, target)] })
        awaitReactions(interaction, message, page-1, target)
      } else if (reaction.emoji.name === LEADERBOARD.RIGHT) {
        await message.edit({ embeds: [generateLeaderboard(page+1, target)] })
        awaitReactions(interaction, message, page+1, target)
      }
    })
    .catch(collected => {});
}

const createLeaderboard = async (interaction, logger, page, target) => {
  const message = await interaction.reply({ embeds: [generateLeaderboard(page, target)], fetchReply: true  })

  message.react(LEADERBOARD.LEFT)
    .then(() => message.react(LEADERBOARD.RIGHT))
    .catch(error => logger.log({
      level: 'error',
      message: `One of the emojis failed to react: ${error}`
    }));

  awaitReactions(interaction, message, page, target)
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top 100 players and their scores')
    .addIntegerOption(op =>
      op.setName('rank')
        .setDescription('Jump to rank')
        .setRequired(false)),

  async execute(interaction, logger) {
    if (interaction.options._hoistedOptions.length > 0) {
      // User has selected a specific rank to jump to
        if (interaction.options._hoistedOptions[0].value > 100 || 
          interaction.options._hoistedOptions[0].value < 1) {
            await interaction.reply({
              content: LEADERBOARD.BAD_RANGE_ERR,
              ephemeral: true 
            });
        } else {
          const target = interaction.options._hoistedOptions[0].value;
          const page = Math.floor((target - 1) / LEADERBOARD.RESULTS_PER_PAGE)
          
          createLeaderboard(interaction, logger, page, target) 
        }
    } else {
      // User has not selected a specific rank to jump to
      createLeaderboard(interaction, logger, 0, 0)
    }
  }
}