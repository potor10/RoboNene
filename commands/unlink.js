const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND, LINK } = require('../constants.json');

const generatedCodes = {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlink a Discord account from your Project Sekai account')
    .addSubcommand(sc =>
      sc.setName('request')
        .setDescription('Request a code to unlink your Project Sekai user ID from a Discord Account')
        .addNumberOption(op =>
          op.setName('id')
            .setDescription('Your Project Sekai user ID')
            .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('authenticate')
        .setDescription('Confirm that the code is set to your Project Sekai profile description')),
  
  async execute(interaction, logger, userDb) {
    switch(interaction.options._subcommand) {
      case 'request':
        const accountId = interaction.options._hoistedOptions[0].value.toString()
        const sekaiCheck = userDb.prepare('SELECT * FROM users WHERE sekai_id=@sekaiId').all({
          sekaiId: accountId
        })

        if (sekaiCheck.length > 0) {
          generatedCodes[interaction.user.id] = {
            code: Math.random().toString(36).slice(-5),
            accountId: accountId,
            expiry: Math.round(Date.now()/1000) + 300
          }
          await interaction.reply({
            content: `**Unlink Code:** \`${generatedCodes[interaction.user.id].code}\`\n` + 
              `**Account ID:** \`${generatedCodes[interaction.user.id].accountId}\`\n` + 
              `**Expires:** <t:${generatedCodes[interaction.user.id].expiry}>`, 
            ephemeral: true 
          });
        } else {
          await interaction.reply({
            content: LINK.NO_SEKAI_ERR,
            ephemeral: true 
          });
        }
        break;
      case 'authenticate':
        const discordCheck = userDb.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
          discordId: interaction.user.id, 
        })

        if (discordCheck.length === 0) {
          await interaction.reply({
            content: LINK.NO_DISCORD_LINK,
            ephemeral: true 
          });

          return
        }

        if (interaction.user.id in generatedCodes) {
          if (generatedCodes[interaction.user.id].expiry < Math.round(Date.now()/1000)) {
            await interaction.reply({
              content: LINK.EXPIRED_CODE_ERR,
              ephemeral: true 
            });
          } else if (Math.random() < 0.5) {
            // Check through the client if the code is set in the description
            userDb.prepare('DELETE FROM users WHERE sekai_id=@sekaiId').run({
              sekaiId: generatedCodes[interaction.user.id].accountId
            })

            logger.log({
              level: 'info',
              sekai_id: generatedCodes[interaction.user.id].accountId,
              message: `Deleted from DB`
            })
            
            await interaction.reply({
              content: LINK.UNLINK_SUCC,
              ephemeral: true 
            });
          } else {
            await interaction.reply({
              content: LINK.GEN_ERR,
              ephemeral: true 
            });
          }
        } else {
          await interaction.reply({
            content: LINK.NO_CODE_ERR,
            ephemeral: true 
          });
        }
        break;
      default:
        await interaction.reply(ERR_COMMAND);
    }
  }
}