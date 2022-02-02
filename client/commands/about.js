const { MessageActionRow, MessageButton } = require('discord.js');
const { BOT_NAME, NENE_COLOR, FOOTER } = require('../../constants');

const COMMAND = require('../command_data/about')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: true
    })

    const EMBED_TITLE = `About ${BOT_NAME}`

    const aboutPages = [
      generateEmbed(EMBED_TITLE, {
        type: '**Programming**',
        message: COMMAND.CONSTANTS.PROGRAMMERS.join('\n')
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Design**',
        message: COMMAND.CONSTANTS.DESIGNERS.join('\n')
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Testers**',
        message: COMMAND.CONSTANTS.TESTERS.join('\n')
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Game Data**',
        message: `[Sekai World](${COMMAND.CONSTANTS.GAME_DATA_LINK})`
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Calculating Estimation**',
        message: `[Bandori Estimation](${COMMAND.CONSTANTS.ESTIMATION_LINK})`
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Ranking Data**',
        message: `[Sekai Best](${COMMAND.CONSTANTS.RANKING_DATA_LINK})`
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Discord**',
        message: COMMAND.CONSTANTS.ABOUT_DISCORD
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Project Sekai**',
        message: COMMAND.CONSTANTS.ABOUT_SEKAI
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Contribute**',
        message: COMMAND.CONSTANTS.ABOUT_CONTRIBUTE
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**Tech Stack**',
        message: COMMAND.CONSTANTS.ABOUT_TECH
      }, discordClient),
      generateEmbed(EMBED_TITLE, {
        type: '**License**',
        message: COMMAND.CONSTANTS.ABOUT_LICENSE
      }, discordClient)
    ]

    const aboutButtons = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`prev`)
          .setLabel('PREV')
          .setStyle('PRIMARY')
          .setEmoji(COMMAND.CONSTANTS.LEFT),
        new MessageButton()
          .setCustomId(`next`)
          .setLabel('NEXT')
          .setStyle('PRIMARY')
          .setEmoji(COMMAND.CONSTANTS.RIGHT))

    let page = 0

    const aboutMessage = await interaction.editReply({ 
      embeds: [aboutPages[page]],
      components: [aboutButtons],
      fetchReply: true
    });

    const filter = (i) => {
      return i.customId == `prev` || i.customId == `next`
    }

    const collector = aboutMessage.createMessageComponentCollector({ 
      filter, 
      time: COMMAND.CONSTANTS.INTERACTION_TIME 
    });
    
    collector.on('collect', async (i) => {
      if (i.customId === `prev`) {
        if (page == 0) {
          page = aboutPages.length - 1
        } else {
          page -= 1;
        }
      } else if (i.customId === `next`) {
        if (page == aboutPages.length - 1) {
          page = 0
        } else {
          page += 1;
        }
      }

      await i.update({ 
        embeds: [aboutPages[page]], 
        components: [aboutButtons]
      });
    })

    collector.on('end', async (collected) => {
      await interaction.editReply({ 
        embeds: [aboutPages[page]], 
        components: []
      });
    });
  }
};