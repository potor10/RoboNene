/**
 * @fileoverview The main output when users call for the /about command
 * Will create a scrollable leaderboard elaborating about the bot and other features
 * @author Potor10
 */

const { MessageActionRow, MessageButton } = require('discord.js');
const { BOT_NAME } = require('../../constants');

const COMMAND = require('../command_data/about')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })

    const EMBED_TITLE = `About ${BOT_NAME}`

    const aboutPages = [
      // Embed generation of a list of programmers who supported the bot
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Programming**',
          message: COMMAND.CONSTANTS.PROGRAMMERS.map((name, index) => {
            return `${index+1}. ${name}`
          }).join('\n')
        },
        client: discordClient.client
      }),
      // Embed generation of a list of designers who provided feedback to the bot
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Design**',
          message: COMMAND.CONSTANTS.DESIGNERS.map((name, index) => {
            return `${index+1}. ${name}`
          }).join('\n')
        }, 
        client: discordClient.client
      }),
      // Embed generation of a list of bot beta testers
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Testers**',
          message: COMMAND.CONSTANTS.TESTERS.map((name, index) => {
            return `${index+1}. ${name}`
          }).join('\n')
        }, 
        client: discordClient.client
      }),
      // Credit to alternative sources where data is pulled from
      generateEmbed({
        name: EMBED_TITLE,
        content: {
          type: '**Game Data**',
          message: `[Sekai World](${COMMAND.CONSTANTS.GAME_DATA_LINK})`
        }, 
        client: discordClient.client
      }),
      // Credit to sources of information on implementing predictions
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Calculating Estimation**',
          message: `[Bandori Estimation](${COMMAND.CONSTANTS.ESTIMATION_LINK})`
        }, 
        client: discordClient.client
      }),
      // Credit to sources of cached / stored ranking data information
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Ranking Data**',
          message: `[Sekai Best](${COMMAND.CONSTANTS.RANKING_DATA_LINK})`
        }, 
        client: discordClient.client
      }),
      // Learn about discord policies & nene robo
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Discord**',
          message: COMMAND.CONSTANTS.ABOUT_DISCORD
        }, 
        client: discordClient.client
      }),
      // Learn about project sekai policies & nene robo
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Project Sekai**',
          message: COMMAND.CONSTANTS.ABOUT_SEKAI
        }, 
        client: discordClient.client
      }),
      // Information on how to contribute to the bot
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Contribute**',
          message: COMMAND.CONSTANTS.ABOUT_CONTRIBUTE
        }, 
        client: discordClient.client
      }),
      // Tech stack information
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**Tech Stack**',
          message: COMMAND.CONSTANTS.ABOUT_TECH
        }, 
        client: discordClient.client
      }),
      // Nene Robo License
      generateEmbed({
        name: EMBED_TITLE, 
        content: {
          type: '**License**',
          message: COMMAND.CONSTANTS.ABOUT_LICENSE
        }, 
        client: discordClient.client
      })
    ]

    const aboutButtons = new MessageActionRow()
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