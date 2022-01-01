const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../constants.json');

const LINK_CONSTANTS = {
  'DISCORD_LINKED_ERR': 'Error! Your Discord account is already linked to a Project Sekai account.',
  'SEKAI_LINKED_ERR': 'Error! That Project Sekai account is already linked to another Discord account.',

  'LINK_SUCC': 'Success! Your account is now linked.',

  'WRONG_ACC_ERR': 'Error! There was an issue in finding this account. Please request a new link code.' + 
    'Make sure all the digits are typed correctly.',

  'EXPIRED_CODE_ERR': 'Error! Your link code has expired',
  'GEN_ERR': 'Error! Invalid code on Project Sekai profile',
  'NO_CODE_ERR': 'Error! Please request a link code first.',
};

const generatedCodes = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account to Project Sekai')
    .addSubcommand(sc =>
      sc.setName('request')
        .setDescription('Request a code to link your Project Sekai user ID to your Discord Account')
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
        const userCheck = commandParams.db.prepare('SELECT * FROM users WHERE discord_id=@discordId OR sekai_id=@sekaiId').all({
          discordId: interaction.user.id, 
          sekaiId: accountId
        });

        if (userCheck.length > 0) {
          if (userCheck[0].discord_id === interaction.user.id) {
            await interaction.reply({
              content: LINK_CONSTANTS.DISCORD_LINKED_ERR,
              ephemeral: true 
            });
          } else if (userCheck[0].sekai_id === accountId) {
            await interaction.reply({
              content: LINK_CONSTANTS.SEKAI_LINKED_ERR,
              ephemeral: true 
            });
          } else {
            await interaction.reply({
              content: ERR_COMMAND,
              ephemeral: true 
            });
          }
        } else {
          generatedCodes[interaction.user.id] = {
            code: Math.random().toString(36).slice(-5),
            accountId: accountId,
            expiry: Math.floor(Date.now()/1000) + 300
          };
          await interaction.reply({
            content: `**Link Code:** \`${generatedCodes[interaction.user.id].code}\`\n` + 
              `**Account ID:** \`${generatedCodes[interaction.user.id].accountId}\`\n` + 
              `**Expires:** <t:${generatedCodes[interaction.user.id].expiry}>`, 
            ephemeral: true 
          });
        }
        break;
      case 'authenticate':
        const discordCheck = commandParams.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
          discordId: interaction.user.id, 
        });

        if (discordCheck.length > 0) {
          if (discordCheck[0].discord_id === interaction.user.id) {
            await interaction.reply({
              content: LINK_CONSTANTS.DISCORD_LINKED_ERR,
              ephemeral: true 
            });

            return;
          }
        }

        if (interaction.user.id in generatedCodes) {
          if (generatedCodes[interaction.user.id].expiry < Math.floor(Date.now()/1000)) {
            await interaction.reply({
              content: LINK_CONSTANTS.EXPIRED_CODE_ERR,
              ephemeral: true 
            });
            return;
          } 
          
          const accountData = await commandParams.api.userProfile(generatedCodes[interaction.user.id].accountId);

          if (accountData.httpStatus) {
            await interaction.reply({
              content: LINK_CONSTANTS.WRONG_ACC_ERR,
              ephemeral: true 
            });

            delete generatedCodes[interaction.user.id]
            return
          }

          if (accountData.userProfile.word === generatedCodes[interaction.user.id].code) {
            commandParams.db.prepare('REPLACE INTO users (discord_id, sekai_id) VALUES(@discordId, @sekaiId)').run({
              discordId: interaction.user.id,
              sekaiId: generatedCodes[interaction.user.id].accountId
            });

            commandParams.logger.log({
              level: 'info',
              discord_id: interaction.user.id,
              sekai_id: generatedCodes[interaction.user.id].accountId,
              message: 'Added to DB',
              timestamp: Date.now()
            });

            await interaction.reply({
              content: LINK_CONSTANTS.LINK_SUCC,
              ephemeral: true 
            });
          } else {
            await interaction.reply({
              content: LINK_CONSTANTS.GEN_ERR,
              ephemeral: true 
            });
          }
        } else {
          await interaction.reply({
            content: LINK_CONSTANTS.NO_CODE_ERR,
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