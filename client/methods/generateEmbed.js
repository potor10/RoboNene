const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

const generateEmbed = (commandName, content, discordClient) => {
  const embed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(commandName.charAt(0).toUpperCase() + commandName.slice(1))
    .addField(content.type.charAt(0).toUpperCase() + content.type.slice(1), 
      content.message.charAt(0).toUpperCase() + content.message.slice(1),)
    .setThumbnail(discordClient.client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return embed
}

module.exports = generateEmbed