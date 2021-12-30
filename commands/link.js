const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND, LINK } = require('../constants.json');

const generatedCodes = {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account to Project Sekai')
    .addSubcommand(sc =>
      sc.setName('request')
        .setDescription('Request a code to link your Project Sekai user ID to your Discord Account')
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
        const userCheck = userDb.prepare('SELECT * FROM users WHERE discord_id=@discordId OR sekai_id=@sekaiId').all({
          discordId: interaction.user.id, 
          sekaiId: accountId
        })

        if (userCheck.length > 0) {
          if (userCheck[0].discord_id === interaction.user.id) {
            await interaction.reply({
              content: LINK.DISCORD_LINKED_ERR,
              ephemeral: true 
            });
          } else if (userCheck[0].sekai_id === accountId) {
            await interaction.reply({
              content: LINK.SEKAI_LINKED_ERR,
              ephemeral: true 
            });
          } else {
            await interaction.reply(ERR_COMMAND);
          }
        } else {
          generatedCodes[interaction.user.id] = {
            code: Math.random().toString(36).slice(-5),
            accountId: accountId,
            expiry: Math.round(Date.now()/1000) + 300
          }
          await interaction.reply({
            content: `**Link Code:** \`${generatedCodes[interaction.user.id].code}\`\n` + 
              `**Account ID:** \`${generatedCodes[interaction.user.id].accountId}\`\n` + 
              `**Expires:** <t:${generatedCodes[interaction.user.id].expiry}>`, 
            ephemeral: true 
          });
        }
        break;
      case 'authenticate':
        const discordCheck = userDb.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
          discordId: interaction.user.id, 
        })

        if (discordCheck.length > 0) {
          if (discordCheck[0].discord_id === interaction.user.id) {
            await interaction.reply({
              content: LINK.DISCORD_LINKED_ERR,
              ephemeral: true 
            });

            return
          }
        }

        if (interaction.user.id in generatedCodes) {
          if (generatedCodes[interaction.user.id].expiry < Math.round(Date.now()/1000)) {
            await interaction.reply({
              content: LINK.EXPIRED_CODE_ERR,
              ephemeral: true 
            });
          } else if (Math.random() < 0.5) {
            // Check through the client if the code is set in the description

            userDb.prepare('REPLACE INTO users (discord_id, sekai_id) VALUES(@discordId, @sekaiId)').run({
              discordId: interaction.user.id,
              sekaiId: generatedCodes[interaction.user.id].accountId
            })

            logger.log({
              level: 'info',
              discord_id: interaction.user.id,
              sekai_id: generatedCodes[interaction.user.id].accountId,
              message: `Added to DB`
            })

            await interaction.reply({
              content: LINK.LINK_SUCC,
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