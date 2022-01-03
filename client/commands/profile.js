const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, REPLY_TIMEOUT, TIMEOUT_ERR } = require('../../constants');

const PROF_CONSTANTS = {
  'NO_ACC_ERROR': 'Error! This user does not have an account with the bot',
  "BAD_INPUT_ERROR": "BAD"
};

const generateProfileEmbed = (discordId, discordClient, data) => {
  const discordUser = discordClient.client.users.cache.get(discordId)
  // userChallengeLiveSoloStages challenge rank
  const profileEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${discordUser.username}'s Profile`)
    .setAuthor({ name: `${discordUser.username}`, iconURL: `${discordUser.displayAvatarURL()}` })
    .setDescription('Project Sekai Profile')
    .setThumbnail('')
    .addFields(
      { name: 'Name', value: `${data.user.userGamedata.name}`, inline: true },
      { name: 'User ID', value: `${data.user.userGamedata.userId}`, inline: true },
      { name: 'Rank', value: `${data.user.userGamedata.rank}`, inline: true },
      { name: 'Description', value: `${data.userProfile.word}` },
      { name: 'Twitter', value: `${data.userProfile.twitterId}` },
      { name: 'Cards', value: `${JSON.stringify(data.userDecks).substring(0, 1000)}` },
      { name: 'Cards2', value: `${JSON.stringify(data.userCards).substring(0, 1000)}` },
      { name: 'Character Ranks', value: `${(JSON.stringify(data.userCharacters)).substring(0, 1000)}` },
      { name: 'Area Items', value: `${JSON.stringify(data.userAreaItems).substring(0, 1000)}` },
    )
    .setImage('')
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return profileEmbed 
}

const getProfile = (interaction, discordClient, discordId, userId) => {
  let replied = false
  discordClient.addSekaiRequest('profile', {
    userId: userId
  }, async (response) => {
    if (interaction.replied) {
      return
    } else if (response.httpRequest) {
      await interaction.reply({
        content: PROF_CONSTANTS.BAD_INPUT_ERROR,
        ephemeral: true 
      });
      replied = true
      return
    }

    const profileEmbed = generateProfileEmbed(discordId, discordClient, response)
    await interaction.reply({
      embeds: [profileEmbed]
    });
    replied = true
  })

  setTimeout(async () => {
    if (!replied) {
      await interaction.reply({
        content: TIMEOUT_ERR,
        ephemeral: true 
      });
    }
  }, REPLY_TIMEOUT)
}

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Project Sekai Profile')
    .addUserOption(op =>
      op.setName('user')
        .setDescription('Discord user')
        .setRequired(false)),

  async execute(interaction, discordClient) {
    const target = (interaction.options._hoistedOptions.length) ? 
      interaction.options._hoistedOptions[0].value :
      interaction.user.id
    
    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: target
    })

    if (user.length === 0) {
      await interaction.reply({
        content: PROF_CONSTANTS.NO_ACC_ERROR,
        ephemeral: true 
      });
      return
    }

    getProfile(interaction, discordClient, target, user[0].sekai_id)
  }
};