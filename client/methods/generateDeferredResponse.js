/**
 * @fileoverview An implementation designed to create an immediate response to any commands
 * in case there is a processing time involved (since Discord API demands immediate responses)
 * Note: Not currently being used
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

/**
 * Generates an Embed that the bot can use to defer a response for later
 * @param {String} commandName the name of the command
 * @param {DiscordClient} discordClient the client we are using to handle Discord requests
 * @return {MessageEmbed} the embed of the deferred response
 */
const generateDeferredResponse = (commandName, discordClient) => {
  const botAvatarURL = discordClient.client.user.displayAvatarURL()

  const deferredResponse = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`Loading...`)
    .setDescription(`Requesting command: \`\`${commandName}\`\`\nPlease be patient`)
    .setThumbnail(botAvatarURL)
    .setTimestamp()
    .setFooter(FOOTER, botAvatarURL);

  return deferredResponse
}

module.exports = generateDeferredResponse
