const { ERR_COMMAND } = require('../../constants');

const COMMAND = require('./spy.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const getRank = require('../methods/getRank')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply()

    if (interaction.options._subcommand === 'player') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');
      if (!accountId) {
        // Do something because there is an empty account id input
        await interaction.editReply({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ID_ERR, discordClient)]
        })
      } else {
        getRank(COMMAND.INFO.name, interaction, discordClient, {
          targetUserId: interaction.options._hoistedOptions[0].value
        })
      }
    } else if (interaction.options._subcommand === 'tier') {
      getRank(COMMAND.INFO.name, interaction, discordClient, {
        targetRank: interaction.options._hoistedOptions[0].value
      })
    } else {
      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, ERR_COMMAND, discordClient)]
      });
    }
  }
};