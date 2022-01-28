const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants');

const COMMAND = require('./link.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

const generatedCodes = {};

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    const db = discordClient.db

    await interaction.deferReply()

    if (interaction.options._subcommand === 'request') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'');

      if (!accountId) {
        // Do something because there is an empty account id input
        await interaction.editReply({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ID_ERR, discordClient)]
        })
        return
      }

      const users = db.prepare('SELECT * FROM users WHERE ' + 
        'discord_id=@discordId OR sekai_id=@sekaiId').all({ 
        discordId: interaction.user.id, 
        sekaiId: accountId
      })

      if (users.length) {
        // User is already linked
        if (users[0].discord_id === interaction.user.id) {
          await interaction.editReply({
            embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.DISCORD_LINKED_ERR, discordClient)]
          });
        } 
        // Sekai id is already linked
        else if (users[0].sekai_id === accountId) {
          await interaction.editReply({
            embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.SEKAI_LINKED_ERR, discordClient)]
          });
        } 
        // General Error
        else {
          await interaction.editReply({
            embeds: [generateEmbed(COMMAND.INFO.name, ERR_COMMAND, discordClient)]
          });
        }
      } else {
        discordClient.addSekaiRequest('profile', {
          userId: accountId
        }, async (response) => {
          // If the response does not exist
          if (response.httpStatus) {
            await interaction.editReply({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ID_ERR, discordClient)]
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

            await interaction.editReply({
              embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)]
            });
          }
        })
      }
    } else if (interaction.options._subcommand === 'authenticate') {
      const users = db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({ 
        discordId: interaction.user.id, 
      })
      
      if (users.length) {
        // If the account is already linked
        if (users[0].discord_id === interaction.user.id) {
          await interaction.editReply({
            embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.DISCORD_LINKED_ERR, discordClient)]
          });

          return;
        }
      }

      if (interaction.user.id in generatedCodes) {
        if (generatedCodes[interaction.user.id].expiry < Date.now()) {
          await interaction.editReply({
            embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.EXPIRED_CODE_ERR, discordClient)]
          });
          return;
        } 
        
        discordClient.addSekaiRequest('profile', {
          userId: generatedCodes[interaction.user.id].accountId
        }, async (response) => {
          // If the response does not exist
          if (response.httpStatus) {
            await interaction.editReply({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ACC_ERR, discordClient)]
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

            await interaction.editReply({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.LINK_SUCC, discordClient)]
            });

          } else {
            await interaction.editReply({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_CODE_ERR, discordClient)]
            });
          }
        })
      } else {
        await interaction.editReply({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_CODE_ERR, discordClient)]
        });
      }
    } else {
      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, ERR_COMMAND, discordClient)]
      });
    }
  }
};