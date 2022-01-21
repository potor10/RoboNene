const { ERR_COMMAND } = require('../../constants');

const COMMAND = require('./spy.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const getRank = require('../methods/getRank')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {

    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND.INFO.name, discordClient)],
      fetchReply: true
    })

    if (interaction.options._subcommand === 'player') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');
      if (!accountId) {
        // Do something because there is an empty account id input
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ID_ERR, discordClient)]
        })
      } else {
        getRank(COMMAND.INFO.name, deferredResponse, discordClient, {
          targetUserId: interaction.options._hoistedOptions[0].value
        })
      }
    } else if (interaction.options._subcommand === 'tier') {
      getRank(COMMAND.INFO.name, deferredResponse, discordClient, {
        targetRank: interaction.options._hoistedOptions[0].value
      })
    } else {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND.INFO.name, ERR_COMMAND, discordClient)]
      });
    }
  }
};