const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants');

const generateDeferredResponse = require('../methods/generateDeferredResponse') 

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
  
  async execute(interaction, discordClient) {
    const db = discordClient.db

    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse('link', discordClient)],
      fetchReply: true
    })

    if (interaction.options._subcommand === 'request') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');

      if (!accountId) {
        // Do something because there is an empty account id input
        await deferredResponse.edit({
          content: "WTF IT IS TRASH"
        })

        return
      }

      const users = db.prepare('SELECT * FROM users WHERE ' + 
        'discord_id=@discordId OR sekai_id=@sekaiId').all({ 
        discordId: interaction.user.id, 
        sekaiId: accountId
      })

      if (users.length > 0) {
        // User is already linked
        if (users[0].discord_id === interaction.user.id) {
          await deferredResponse.edit({
            content: LINK_CONSTANTS.DISCORD_LINKED_ERR
          });
        } 
        // Sekai id is already linked
        else if (users[0].sekai_id === accountId) {
          await deferredResponse.edit({
            content: LINK_CONSTANTS.SEKAI_LINKED_ERR
          });
        } 
        // General Error
        else {
          await deferredResponse.edit({
            content: ERR_COMMAND
          });
        }
      } else {
        // Generate a new code for the user
        generatedCodes[interaction.user.id] = {
          code: Math.random().toString(36).slice(-5),
          accountId: accountId,
          expiry: Date.now() + 300000
        };

        await deferredResponse.edit({
          content: `**Link Code:** \`${generatedCodes[interaction.user.id].code}\`\n` + 
            `**Account ID:** \`${generatedCodes[interaction.user.id].accountId}\`\n` + 
            `**Expires:** <t:${Math.floor(generatedCodes[interaction.user.id].expiry/1000)}>`
        });
      }
    } else if (interaction.options._subcommand === 'authenticate') {
      const users = db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({ 
        discordId: interaction.user.id, 
      })
      
      if (users.length > 0) {
        // If the account is already linked
        if (users[0].discord_id === interaction.user.id) {
          await deferredResponse.edit({
            content: LINK_CONSTANTS.DISCORD_LINKED_ERR
          });

          return;
        }
      }

      if (interaction.user.id in generatedCodes) {
        if (generatedCodes[interaction.user.id].expiry < Date.now()) {
          await deferredResponse.edit({
            content: LINK_CONSTANTS.EXPIRED_CODE_ERR
          });
          return;
        } 
        
        discordClient.addSekaiRequest('profile', {
          userId: generatedCodes[interaction.user.id].accountId
        }, async (response) => {
          // If the response does not exist
          if (response.httpStatus) {
            await deferredResponse.edit({
              content: LINK_CONSTANTS.WRONG_ACC_ERR
            });

            delete generatedCodes[interaction.user.id]
            return
          }


          if (response.userProfile.word === generatedCodes[interaction.user.id].code) {
            db.prepare('REPLACE INTO users (discord_id, sekai_id) ' + 
              'VALUES(@discordId, @sekaiId)').run({
              discordId: interaction.user.id,
              sekaiId: generatedCodes[interaction.user.id].accountId
            })

            await deferredResponse.edit({
              content: LINK_CONSTANTS.LINK_SUCC
            });

          } else {
            await deferredResponse.edit({
              content: LINK_CONSTANTS.GEN_ERR
            });
          }
        })
      } else {
        await deferredResponse.edit({
          content: LINK_CONSTANTS.NO_CODE_ERR
        });
      }
    } else {
      await deferredResponse.edit({
        content: ERR_COMMAND
      });
    }
  }
};