const COMMAND = require('./rank.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const getRank = require('../methods/getRank')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND.INFO.name, discordClient)],
      fetchReply: true
    })

    const target = (interaction.options._hoistedOptions.length) ? 
      interaction.options._hoistedOptions[0].value :
      interaction.user.id
    
    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: target
    })

    if (!user.length) {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_ACC_ERROR, discordClient)]
      });
      return
    }

    getRank(COMMAND.INFO.name, deferredResponse, discordClient, {
      targetUserId: user[0].sekai_id
    })
  }
};