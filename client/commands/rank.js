const COMMAND = require('../command_data/rank')

const generateSlashCommand = require('../methods/generateSlashCommand')
const getRank = require('../methods/getRank')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply()

    const target = (interaction.options._hoistedOptions.length) ? 
      interaction.options._hoistedOptions[0].value :
      interaction.user.id
    
    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: target
    })

    if (!user.length) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.NO_ACC_ERROR, 
            client: discordClient.client
          })
        ]
      });
      return
    }

    getRank(COMMAND.INFO.name, interaction, discordClient, {
      targetUserId: user[0].sekai_id
    })
  }
};