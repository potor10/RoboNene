const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

const generateEmbed = ({name, content, image, client}) => {
  const embed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(name.charAt(0).toUpperCase() + name.slice(1))
    .addField(content.type.charAt(0).toUpperCase() + content.type.slice(1), 
      content.message.charAt(0).toUpperCase() + content.message.slice(1),)
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter(FOOTER, client.user.displayAvatarURL());

  if (image) {
    embed.setImage(image)
  }

  return embed
}

module.exports = generateEmbed