/**
 * @fileoverview The main output when users call for the /leaderboard command
 * Shows an updated, scrollable snapshot of the top 100 ranks at the moment
 * @author Potor10
 */

const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, RESULTS_PER_PAGE } = require('../../constants');

const COMMAND = require('../command_data/leaderboard')

const MAX_PAGE = Math.ceil(100 / RESULTS_PER_PAGE) -1

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateRankingText = require('../methods/generateRankingText')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),

  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })

    const event = discordClient.getCurrentEvent()
    // There is no event at the moment
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

    // Ensure that the user has not surpassed the rate limit
    if (!discordClient.checkRateLimit(interaction.user.id)) {
      await interaction.editReply({
        embeds: [generateEmbed({
          name: COMMAND.INFO.name,
          content: { 
            type: COMMAND.CONSTANTS.RATE_LIMIT_ERR.type, 
            message: COMMAND.CONSTANTS.RATE_LIMIT_ERR.message + 
              `\n\nExpires: <t:${Math.floor(discordClient.getRateLimitRemoval(interaction.user.id) / 1000)}>`
          },
          client: discordClient.client
        })]
      })
      return
    }

    discordClient.addSekaiRequest('ranking', {
      eventId: event.id,
      targetRank: 1,
      lowerLimit: 99
    }, async (response) => {
      // Check if the response is valid
      if (!response.rankings) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: commandName, 
              content: COMMAND.CONSTANTS.NO_RESPONSE_ERR, 
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
              content: COMMAND.CONSTANTS.BAD_INPUT_ERROR, 
              client: discordClient.client
            })
          ]
        });
        return
      }

      const rankingData = response.rankings
      const timestamp = Date.now()

      let target = 0;
      let page = 0;

      if (interaction.options._hoistedOptions.length) {
        // User has selected a specific rank to jump to
          if (interaction.options._hoistedOptions[0].value > 100 || 
            interaction.options._hoistedOptions[0].value < 1) {
            await interaction.editReply({
              embeds: [
                generateEmbed({
                  name: COMMAND.INFO.name, 
                  content: COMMAND.CONSTANTS.BAD_RANGE_ERR,
                  client: discordClient.client
                })
              ]
            });
            return;
          } else {
            target = interaction.options._hoistedOptions[0].value;
            page = Math.floor((target - 1) / RESULTS_PER_PAGE);
          }
      }

      let start = page * RESULTS_PER_PAGE;
      let end = start + RESULTS_PER_PAGE;
    
      let leaderboardText = generateRankingText(rankingData.slice(start, end), page, target)
      
      let leaderboardEmbed = new MessageEmbed()
        .setColor(NENE_COLOR)
        .setTitle(`${event.name}`)
        .setDescription(`T100 Leaderboard at <t:${Math.floor(timestamp/1000)}>`)
        .addField(`Page ${page+1}`, leaderboardText, false)
        .setThumbnail(event.banner)
        .setTimestamp()
        .setFooter(FOOTER, interaction.user.displayAvatarURL());
      
      const leaderboardButtons = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`prev`)
            .setLabel('PREV')
            .setStyle('SECONDARY')
            .setEmoji(COMMAND.CONSTANTS.LEFT),
          new MessageButton()
            .setCustomId(`next`)
            .setLabel('NEXT')
            .setStyle('SECONDARY')
            .setEmoji(COMMAND.CONSTANTS.RIGHT))

      const leaderboardMessage = await interaction.editReply({ 
        embeds: [leaderboardEmbed], 
        components: [leaderboardButtons],
        fetchReply: true
      });

      // Create a filter for valid responses
      const filter = (i) => {
        return i.customId == `prev` || i.customId == `next`
      }

      const collector = leaderboardMessage.createMessageComponentCollector({ 
        filter, 
        time: COMMAND.CONSTANTS.INTERACTION_TIME 
      });
      
      // Collect user interactions with the prev / next buttons
      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            embeds: [
              generateEmbed({
                name: COMMAND.INFO.name, 
                content: COMMAND.CONSTANTS.WRONG_USER_ERR,
                client: discordClient.client
              })
            ],
            ephemeral: true
          })
          return
        }

        if (i.customId === `prev`) {
          if (page == 0) {
            page = MAX_PAGE
          } else {
            page -= 1;
          }
        } else if (i.customId === `next`) {
          if (page == MAX_PAGE) {
            page = 0
          } else {
            page += 1;
          }
        }

        start = page * RESULTS_PER_PAGE;
        end = start + RESULTS_PER_PAGE;
        leaderboardText = generateRankingText(rankingData.slice(start, end), page, target)
        leaderboardEmbed = new MessageEmbed()
          .setColor(NENE_COLOR)
          .setTitle(`${event.name}`)
          .setDescription(`T100 Leaderboard at <t:${Math.floor(timestamp/1000)}>`)
          .addField(`Page ${page+1} / ${MAX_PAGE+1}`, leaderboardText, false)
          .setThumbnail(event.banner)
          .setTimestamp()
          .setFooter(FOOTER, interaction.user.displayAvatarURL());

        await i.update({ 
          embeds: [leaderboardEmbed], 
          components: [leaderboardButtons]
        });
      })

      collector.on('end', async (collected) => {
        await interaction.editReply({ 
          embeds: [leaderboardEmbed], 
          components: []
        });
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
          name: COMMAND.INFO.name,
          content: { type: 'error', message: err.toString() },
          client: discordClient.client
        })]
      })
    })
  }
};