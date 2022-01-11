const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants');

const COMMAND_NAME = 'link'

const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const LINK_CONSTANTS = {
  'DISCORD_LINKED_ERR': {
    type: 'Error',
    message: 'Your Discord account is already linked to a Project Sekai account.'
  },

  'SEKAI_LINKED_ERR': {
    type: 'Error',
    message: 'That Project Sekai account is already linked to another Discord account.'
  },

  'LINK_SUCC': {
    type: 'Success',
    message: 'Your account is now linked.'
  },

  'BAD_ID_ERR': {
    type: 'Error', 
    message: 'You have provided an invalid ID.'
  },

  'BAD_ACC_ERR': {
    type: 'Error',
    message: 'There was an issue in finding this account. Please request a new link code.' + 
      'Make sure all the digits are typed correctly.'
  },

  'EXPIRED_CODE_ERR': {
    type: 'Error',
    message: 'Your link code has expired.'
  },

  'BAD_CODE_ERR': {
    type: 'Error', 
    message: 'Invalid code on Project Sekai profile. ' + 
      'Did you remember to press back on your profile to save the changes?'
  },

  'NO_CODE_ERR': {
    type: 'Error', 
    message: 'Please request a link code first.'
  },
};

const generatedCodes = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
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
      embeds: [generateDeferredResponse(COMMAND_NAME, discordClient)],
      fetchReply: true
    })

    if (interaction.options._subcommand === 'request') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');

      if (!accountId) {
        // Do something because there is an empty account id input
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.BAD_ID_ERR, discordClient)]
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
            embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.DISCORD_LINKED_ERR, discordClient)]
          });
        } 
        // Sekai id is already linked
        else if (users[0].sekai_id === accountId) {
          await deferredResponse.edit({
            embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.SEKAI_LINKED_ERR, discordClient)]
          });
        } 
        // General Error
        else {
          await deferredResponse.edit({
            embeds: [generateEmbed(COMMAND_NAME, ERR_COMMAND, discordClient)]
          });
        }
      } else {
        discordClient.addSekaiRequest('profile', {
          userId: accountId
        }, async (response) => {
          // If the response does not exist
          if (response.httpStatus) {
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.BAD_ID_ERR, discordClient)]
            })
          } else {
            // Generate a new code for the user
            generatedCodes[interaction.user.id] = {
              code: Math.random().toString(36).slice(-5),
              accountId: accountId,
              expiry: Date.now() + 300000
            };

            const content = {
              type: 'Success',
              message: `Link Code: \`${generatedCodes[interaction.user.id].code}\`\n` + 
                `Account ID: \`${generatedCodes[interaction.user.id].accountId}\`\n` + 
                `Expires: <t:${Math.floor(generatedCodes[interaction.user.id].expiry/1000)}>`
            }

            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND_NAME, content, discordClient)]
            });
          }
        })
      }
    } else if (interaction.options._subcommand === 'authenticate') {
      const users = db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({ 
        discordId: interaction.user.id, 
      })
      
      if (users.length > 0) {
        // If the account is already linked
        if (users[0].discord_id === interaction.user.id) {
          await deferredResponse.edit({
            embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.DISCORD_LINKED_ERR, discordClient)]
          });

          return;
        }
      }

      if (interaction.user.id in generatedCodes) {
        if (generatedCodes[interaction.user.id].expiry < Date.now()) {
          await deferredResponse.edit({
            embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.EXPIRED_CODE_ERR, discordClient)]
          });
          return;
        } 
        
        discordClient.addSekaiRequest('profile', {
          userId: generatedCodes[interaction.user.id].accountId
        }, async (response) => {
          // If the response does not exist
          if (response.httpStatus) {
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.BAD_ACC_ERR, discordClient)]
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
              embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.LINK_SUCC, discordClient)]
            });

          } else {
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.BAD_CODE_ERR, discordClient)]
            });
          }
        })
      } else {
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND_NAME, LINK_CONSTANTS.NO_CODE_ERR, discordClient)]
        });
      }
    } else {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND_NAME, ERR_COMMAND, discordClient)]
      });
    }
  }
};