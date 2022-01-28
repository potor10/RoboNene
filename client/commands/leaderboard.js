const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, RESULTS_PER_PAGE } = require('../../constants');

const COMMAND = require('./leaderboard.json')

const MAX_PAGE = Math.ceil(100 / RESULTS_PER_PAGE) -1

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateRankingText = require('../methods/generateRankingText')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),

  async execute(interaction, discordClient) {
    await interaction.deferReply()

    const event = discordClient.getCurrentEvent()
    if (event.id === -1) {
      await interaction.editReply({
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
        await interaction.editReply({
          embeds: [generateEmbed(commandName, COMMAND.CONSTANTS.NO_RESPONSE_ERR, discordClient)]
        });
        return
      } else if (response.rankings.length === 0) {
        await interaction.editReply({
          embeds: [generateEmbed(commandName, COMMAND.CONSTANTS.BAD_INPUT_ERROR, discordClient)]
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
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_RANGE_ERR, discordClient)]
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
            .setCustomId(`left${interaction.id}`)
            .setLabel('LEFT')
            .setStyle('PRIMARY')
            .setEmoji(COMMAND.CONSTANTS.LEFT),
          new MessageButton()
            .setCustomId(`right${interaction.id}`)
            .setLabel('RIGHT')
            .setStyle('PRIMARY')
            .setEmoji(COMMAND.CONSTANTS.RIGHT))

      await interaction.editReply({ 
        embeds: [leaderboardEmbed], 
        components: [leaderboardButtons]
      });

      const filter = (i) => {
        return (i.customId == `left${interaction.id}` || i.customId == `right${interaction.id}`) && i.user.id == interaction.user.id
      }

      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
      
      collector.on('collect', async i => {
        if (i.customId === `left${interaction.id}`) {
          if (page == 0) {
            page = MAX_PAGE
          } else {
            page -= 1;
          }
        } else if (i.customId === `right${interaction.id}`) {
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
          .addField(`Page ${page+1}`, leaderboardText, false)
          .setThumbnail(event.banner)
          .setTimestamp()
          .setFooter(FOOTER, interaction.user.displayAvatarURL());

        await i.update({ 
          embeds: [leaderboardEmbed], 
          components: [leaderboardButtons]
        });
      })
    })
  }
};