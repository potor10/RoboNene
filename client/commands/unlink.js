const { ERR_COMMAND } = require('../../constants');

const COMMAND = require('./unlink.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const generatedCodes = {};

module.exports = {
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    const db = discordClient.db

    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND.INFO.name, discordClient)],
      fetchReply: true
    })

    if (interaction.options._subcommand === 'request') {
      const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'')

      if (!accountId) {
        // Do something because there is an empty account id input
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ID_ERR, discordClient)]
        })
        return
      }

      const sekaiCheck = db.prepare('SELECT * FROM users WHERE sekai_id=@sekaiId').all({
        sekaiId: accountId
      });

      if (sekaiCheck.length) {
        discordClient.addSekaiRequest('profile', {
          userId: accountId
        }, async (response) => {
          // If the response does not exist
          if (response.httpStatus) {
            await deferredResponse.edit({
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

            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND.INFO.name, content, discordClient)]
            });
          }
        })
      } else {
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_SEKAI_ERR, discordClient)]
        });
      }
    } else if (interaction.options._subcommand === 'authenticate') {
      const discordCheck = db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
        discordId: interaction.user.id, 
      });

      if (!discordCheck.length) {
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_DISCORD_LINK, discordClient)]
        });
        return;
      }

      if (interaction.user.id in generatedCodes) {
        if (generatedCodes[interaction.user.id].expiry < Date.now()) {
          await deferredResponse.edit({
            embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.EXPIRED_CODE_ERR, discordClient)]
          });
          return;
        } 

        discordClient.addSekaiRequest('profile', {
          userId: generatedCodes[interaction.user.id].accountId
        }, async (response) => {
          if (response.httpStatus) {
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ACC_ERR, discordClient)]
            });

            delete generatedCodes[interaction.user.id]
            return
          }

          if (response.userProfile.word === generatedCodes[interaction.user.id].code) {
            // Check through the client if the code is set in the description
            db.prepare('DELETE FROM users WHERE sekai_id=@sekaiId').run({
              sekaiId: generatedCodes[interaction.user.id].accountId
            });
            
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.UNLINK_SUCC, discordClient)]
            });
          } else {
            await deferredResponse.edit({
              embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_CODE_ERR, discordClient)]
            });
          }
        })
      } else {
        await deferredResponse.edit({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_CODE_ERR, discordClient)]
        });
      }
    } else {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND.INFO.name, ERR_COMMAND, discordClient)]
      });
    }
  }
};