const COMMAND = require('./private.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    const db = discordClient.db

    await interaction.deferReply()

    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: interaction.user.id
    })

    if (!user.length) {
      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_ACC_ERROR, discordClient)]
      });
      return
    }

    db.prepare('UPDATE users SET private=@private WHERE discord_id=@discordId').run({
      private: (interaction.options._hoistedOptions[0].value) ? 1 : 0,
      discordId: interaction.user.id
    });

    const content = {
      type: 'Success',
      message: `Private\nStatus: \`\`${(interaction.options._hoistedOptions[0].value) ? 'Enabled' : 'Disabled'}\`\`\n` 
    }

    await interaction.editReply({
      embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)],
      ephemeral: true 
    });
  }
};