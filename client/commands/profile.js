const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const fs = require('fs');
const getCard = require('../methods/getCard')

// TODO 
// Update reply to be embed

const PROF_CONSTANTS = {
  'NO_ACC_ERROR': 'Error! This user does not have an account with the bot',
  "BAD_INPUT_ERROR": "BAD"
};

const generateProfileEmbed = (discordId, discordClient, data) => {
  const areaItemLevels = JSON.parse(fs.readFileSync('./sekai_master/areaItemLevels.json'));
  const areaItems = JSON.parse(fs.readFileSync('./sekai_master/areaItems.json'));
  const characterProfiles = JSON.parse(fs.readFileSync('./sekai_master/characterProfiles.json'));
  const gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
  

  const leaderCardId = data.userDecks[0].leader
  let leader = {}
  
  for(const idx in data.userCards) {
    if (data.userCards[idx].cardId === leaderCardId) {
      console.log(idx)
      leader = data.userCards[idx]
      break
    }
  }

  const leaderCard = getCard(leaderCardId)

  let leaderThumbURL = 'https://sekai-res.dnaroma.eu/file/sekai-assets/' + 
    `thumbnail/chara_rip/${leaderCard.assetbundleName}`

  let leaderFullURL = 'https://sekai-res.dnaroma.eu/file/sekai-assets/' + 
    `character/member/${leaderCard.assetbundleName}_rip/`


  if (leader.specialTrainingStatus === 'done') {
    leaderThumbURL += '_after_training.webp'
    leaderFullURL += 'card_after_training.webp'
  } else {
    leaderThumbURL += '_normal.webp'
    leaderFullURL += 'card_normal.webp'
  }

  let teamText = ''
  Object.keys(data.userDecks[0]).forEach((pos) => {
    if (pos !== 'leader') {
      positionId = data.userDecks[0][pos]

      data.userCards.forEach((card) => {
        if (card.cardId === positionId) {
          const cardInfo = getCard(positionId)
          const charInfo = gameCharacters[cardInfo.characterId-1]
          teamText += '⭐'.repeat(cardInfo.rarity)
          teamText += cardInfo.attr
          teamText += `${cardInfo.prefix} ${charInfo.givenName} ${charInfo.firstName}\n`
        }
      })
    }
  })

  let characterRankText = ''
  data.userCharacters.forEach((char) => {
    const charInfo = gameCharacters[char.characterId-1]
    characterRankText += `${charInfo.givenName} ${charInfo.firstName} Rank ${char.characterRank}\n`
  })

  let areaItemText = ''
  data.userAreaItems.forEach((item) => {
    const itemInfo = areaItems[item.areaItemId-1]
    let itemLevel = {}
    for(const idx in areaItemLevels) {
      if (areaItemLevels[idx].areaItemId === item.areaItemId &&
        areaItemLevels[idx].level === item.level) {
        itemLevel = areaItemLevels[idx]
        break
      }
    }

    areaItemText += `${itemInfo.name} ${itemLevel.sentence}\n`
  })

  let challengeRankText = ''
  let currentChallengeCharId = -1

  for(let i = 0; i < data.userChallengeLiveSoloStages.length; i++) {
    if (currentChallengeCharId === -1) {
      currentChallengeCharId = data.userChallengeLiveSoloStages[i].characterId
    } else if (data.userChallengeLiveSoloStages[i].characterId !== currentChallengeCharId) {
      const charInfo = gameCharacters[currentChallengeCharId-1]
      challengeRankText += `${charInfo.givenName} ${charInfo.firstName} Rank: ` + 
        `${data.userChallengeLiveSoloStages[i-1].rank}\n`
    }
  }

  const lastChar = data.userChallengeLiveSoloStages[data.userChallengeLiveSoloStages.length-1]
  const charInfo = gameCharacters[lastChar.characterId-1]
  challengeRankText += `${charInfo.givenName} ${charInfo.firstName} Rank: ` + 
    `${data.userChallengeLiveSoloStages[i-1].rank}\n`

  // console.log(data)

  const discordUser = discordClient.client.users.cache.get(discordId)
  // userChallengeLiveSoloStages challenge rank
  const profileEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${discordUser.username}'s Profile`)
    .setAuthor({ name: `${discordUser.username}`, iconURL: `${discordUser.displayAvatarURL()}` })
    .setDescription('Project Sekai Profile')
    .setThumbnail(leaderThumbURL)
    .addFields(
      { name: 'Name', value: `${data.user.userGamedata.name}`, inline: false },
      { name: 'User ID', value: `${data.user.userGamedata.userId}`, inline: false },
      { name: 'Rank', value: `${data.user.userGamedata.rank}`, inline: false },
      { name: 'Description', value: `${data.userProfile.word}` },
      { name: 'Twitter', value: `@${data.userProfile.twitterId.substring(0, 1000)}` },
      { name: 'Cards', value: `${teamText.substring(0, 1000)}` },
      { name: 'Character Ranks', value: `${characterRankText.substring(0, 1000)}` },
      { name: 'Area Items', value: `${areaItemText.substring(0, 1000)}` },
      { name: 'Challenge Rank', value: `${challengeRankText.substring(0, 1000)}`}
    )
    .setImage(leaderFullURL)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  return profileEmbed 
}

const getProfile = async (interaction, discordClient, discordId, userId) => {
  const deferredResponse = await interaction.reply({
    content: 'hello omega',
    fetchReply: true
  });

  discordClient.addSekaiRequest('profile', {
    userId: userId
  }, async (response) => {
    if (response.httpRequest) {
      await interaction.reply({
        content: PROF_CONSTANTS.BAD_INPUT_ERROR,
        ephemeral: true 
      });
      return
    }

    const profileEmbed = generateProfileEmbed(discordId, discordClient, response)
    await deferredResponse.edit({
      embeds: [profileEmbed]
    });
  })
}

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Project Sekai Profile')
    .addStringOption(op =>
      op.setName('user')
        .setDescription('Sekai user id')
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