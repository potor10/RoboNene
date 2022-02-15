const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { ERR_COMMAND, NENE_COLOR, FOOTER } = require('../../constants');

const COMMAND = require('../command_data/unlink')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

const generateUnlinkEmbed = ({code, accountId, expires, content, client}) => {
  const imageUrl = 'https://cdn.discordapp.com/attachments/812255511667015691/938557065469788190/IMG_0037.png'

  const unlinkInformation = {
    type: 'Unlink Information',
    message: `Unlink Code: \`${code}\`\n` + 
      `Account ID: \`${accountId}\`\n` + 
      `Expires: <t:${Math.floor(expires/1000)}>`
  }

  const unlinkEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(COMMAND.INFO.name.charAt(0).toUpperCase() + COMMAND.INFO.name.slice(1))
    .addField(unlinkInformation.type, unlinkInformation.message)
    .addField(COMMAND.CONSTANTS.UNLINK_INSTRUCTIONS.type, COMMAND.CONSTANTS.UNLINK_INSTRUCTIONS.message)
    .setImage(imageUrl)
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter(FOOTER, client.user.displayAvatarURL());

  if (content) {
    unlinkEmbed.addField(content.type, content.message)
  }

  return unlinkEmbed
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    // { ephemeral: true }
    await interaction.deferReply()

    const db = discordClient.db
    const accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'')

    if (!accountId) {
      // Do something because there is an empty account id input
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name:COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.BAD_ID_ERR, 
            client: discordClient.client
          })
        ]
      })
      return
    }

    const sekaiCheck = db.prepare('SELECT * FROM users WHERE sekai_id=@sekaiId').all({
      sekaiId: accountId
    });

    // User exists in the database
    if (!sekaiCheck.length) { 
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.NO_SEKAI_ERR, 
            client: discordClient.client
          })
        ]
      });
      return
    }

    discordClient.addSekaiRequest('profile', {
      userId: accountId
    }, async (response) => {
      // Generate a new code for the user
      const code = Math.random().toString(36).slice(-5)
      const expires = Date.now() + COMMAND.CONSTANTS.INTERACTION_TIME

      const unlinkButton = new MessageActionRow()
        .addComponents(new MessageButton()
          .setCustomId(`unlink`)
          .setLabel('UNLINK')
          .setStyle('DANGER')
          .setEmoji(COMMAND.CONSTANTS.UNLINK_EMOJI))

      const unlinkMessage = await interaction.editReply({
        embeds: [
          generateUnlinkEmbed({
            code: code, 
            accountId: accountId,
            expires: expires,
            client: discordClient.client
          })
        ],
        components: [unlinkButton],
        fetchReply: true
      });

      let unlinked = false

      const filter = (i) => {
        return i.customId == `unlink`
      }
  
      const collector = unlinkMessage.createMessageComponentCollector({ 
        filter, 
        time: COMMAND.CONSTANTS.INTERACTION_TIME 
      });
      
      collector.on('collect', async (i) => {
        await i.update({
          embeds: [
            generateUnlinkEmbed({
              code: code, 
              accountId: accountId,
              expires: expires,
              client: discordClient.client
            })
          ],
          components: []
        });
  
        discordClient.addSekaiRequest('profile', {
          userId: accountId
        }, async (response) => {
          if (response.userProfile.word === code) {
            // Check through the client if the code is set in the description
            db.prepare('DELETE FROM users WHERE sekai_id=@sekaiId').run({
              sekaiId: accountId
            });

            unlinked = true

            await interaction.editReply({
              embeds: [
                generateUnlinkEmbed({
                  code: code, 
                  accountId: accountId,
                  expires: expires,
                  content: COMMAND.CONSTANTS.UNLINK_SUCC,
                  client: discordClient.client
                })
              ],
              components: []
            });
          } else {
            await interaction.editReply({
              embeds: [
                generateUnlinkEmbed({
                  code: code, 
                  accountId: accountId,
                  expires: expires,
                  content: COMMAND.CONSTANTS.BAD_CODE_ERR(response.userProfile.word),
                  client: discordClient.client
                })
              ],
              components: [unlinkButton]
            });
          }
        }, async (err) => {
          // Log the error
          discordClient.logger.log({
            level: 'error',
            message: err.toString()
          })

          // Account could not be found
          await interaction.editReply({ 
            embeds: [
              generateUnlinkEmbed({
                code: code, 
                accountId: accountId,
                expires: expires,
                content: { type: 'error', message: err.toString() },
                client: discordClient.client
              })
            ], 
            components: []
          });
        })
      })

      collector.on('end', async (collected) => {
        // No Response
        if (!unlinked) {
          await interaction.editReply({ 
            embeds: [
              generateUnlinkEmbed({
                code: code, 
                accountId: accountId,
                expires: expires,
                content: COMMAND.CONSTANTS.EXPIRED_CODE_ERR,
                client: discordClient.client
              })
            ], 
            components: []
          });
        }
      });
    }, async (err) => {
      // Log the error
      discordClient.logger.log({
        level: 'error',
        message: err.toString()
      })

      if (err.getCode() === 404) {
        // We got an error trying to find this account
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.BAD_ID_ERR, 
              client: discordClient.client
            })
          ]
        })
      } else {
        await interaction.editReply({
          embeds: [generateEmbed({
            name: COMMAND.INFO.name,
            content: { type: 'error', message: err.toString() },
            client: discordClient.client
          })]
        })
      }
    })
  } 
};