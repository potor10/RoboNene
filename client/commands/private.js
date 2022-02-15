const COMMAND = require('../command_data/private')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    // { ephemeral: true }
    await interaction.deferReply()

    const db = discordClient.db

    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: interaction.user.id
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

    db.prepare('UPDATE users SET private=@private WHERE discord_id=@discordId').run({
      private: (interaction.options._hoistedOptions[0].value) ? 1 : 0,
      discordId: interaction.user.id
    });

    const content = {
      type: 'Success',
      message: `Private\nStatus: \`\`${(interaction.options._hoistedOptions[0].value) ? 'Enabled' : 'Disabled'}\`\`\n\n` +
        `You can ${(interaction.options._hoistedOptions[0].value) ? 'no longer' : 'now'} see \`Area Item\` and \`Card Level\`` +
        `information when someone uses /profile on your ID`
    }

    await interaction.editReply({
      embeds: [
        generateEmbed({
          name: COMMAND.INFO.name, 
          content: content, 
          client: discordClient.client
        })
      ],
      ephemeral: true 
    });
  }
};