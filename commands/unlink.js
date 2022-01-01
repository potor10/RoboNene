const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../constants.json');

const UNLINK_CONSTANTS = {
  'DISCORD_LINKED_ERR': 'Error! Your Discord account is already linked to a Project Sekai account.',
  'SEKAI_LINKED_ERR': 'Error! That Project Sekai account is already linked to another Discord account.',

  'EXPIRED_CODE_ERR': 'Error! Your link code has expired',
  'GEN_ERR': 'Error! Invalid code on Project Sekai profile',
  'NO_CODE_ERR': 'Error! Please request a link code first.',

  'NO_SEKAI_ERR': 'Error! This Project Sekai account is not linked to any Discord account.',
  'NO_DISCORD_LINK': 'Error! This Discord account is not linked to any Project Sekai account.',

  'UNLINK_SUCC': 'Success! Your account is now unlinked.'
};

const generatedCodes = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlink a Discord account from your Project Sekai account')
    .addSubcommand(sc =>
      sc.setName('request')
        .setDescription('Request a code to unlink your Project Sekai user ID from a Discord Account')
        .addStringOption(op =>
          op.setName('id')
            .setDescription('Your Project Sekai user ID')
            .setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('authenticate')
        .setDescription('Confirm that the code is set to your Project Sekai profile description')),
  
  async execute(interaction, commandParams) {
    switch(interaction.options._subcommand) {
      case 'request':
        const accountId = interaction.options._hoistedOptions[0].value;
        const sekaiCheck = commandParams.db.prepare('SELECT * FROM users WHERE sekai_id=@sekaiId').all({
          sekaiId: accountId
        });

        if (sekaiCheck.length > 0) {
          generatedCodes[interaction.user.id] = {
            code: Math.random().toString(36).slice(-5),
            accountId: accountId,
            expiry: Math.floor(Date.now()/1000) + 300
          };
          await interaction.reply({
            content: `**Unlink Code:** \`${generatedCodes[interaction.user.id].code}\`\n` + 
              `**Account ID:** \`${generatedCodes[interaction.user.id].accountId}\`\n` + 
              `**Expires:** <t:${generatedCodes[interaction.user.id].expiry}>`, 
            ephemeral: true 
          });
        } else {
          await interaction.reply({
            content: UNLINK_CONSTANTS.NO_SEKAI_ERR,
            ephemeral: true 
          });
        }
        break;
      case 'authenticate':
        const discordCheck = commandParams.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
          discordId: interaction.user.id, 
        });

        if (discordCheck.length === 0) {
          await interaction.reply({
            content: UNLINK_CONSTANTS.NO_DISCORD_LINK,
            ephemeral: true 
          });

          return;
        }

        if (interaction.user.id in generatedCodes) {
          if (generatedCodes[interaction.user.id].expiry < Math.floor(Date.now()/1000)) {
            await interaction.reply({
              content: UNLINK_CONSTANTS.EXPIRED_CODE_ERR,
              ephemeral: true 
            });
            return;
          } 

          const accountData = await commandParams.api.userProfile(generatedCodes[interaction.user.id].accountId);
          if (accountData.userProfile.word === generatedCodes[interaction.user.id].code) {
            // Check through the client if the code is set in the description
            commandParams.db.prepare('DELETE FROM users WHERE sekai_id=@sekaiId').run({
              sekaiId: generatedCodes[interaction.user.id].accountId
            });

            commandParams.logger.log({
              level: 'info',
              sekai_id: generatedCodes[interaction.user.id].accountId,
              message: 'Deleted from DB',
              timestamp: Date.now()
            });
            
            await interaction.reply({
              content: UNLINK_CONSTANTS.UNLINK_SUCC,
              ephemeral: true 
            });
          } else {
            await interaction.reply({
              content: UNLINK_CONSTANTS.GEN_ERR,
              ephemeral: true 
            });
          }
        } else {
          await interaction.reply({
            content: UNLINK_CONSTANTS.NO_CODE_ERR,
            ephemeral: true 
          });
        }
        break;
      default:
        await interaction.reply({
          content: ERR_COMMAND,
          ephemeral: true 
        });
    }
  }
};