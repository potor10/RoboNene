const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

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
