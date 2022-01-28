const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const fs = require('fs');

const COMMAND = require('./profile.json')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 
const binarySearch = require('../methods/binarySearch')

const generateProfileEmbed = (discordClient, data, private) => {
  const areas = JSON.parse(fs.readFileSync('./sekai_master/areas.json'));
  const areaItemLevels = JSON.parse(fs.readFileSync('./sekai_master/areaItemLevels.json'));
  const areaItems = JSON.parse(fs.readFileSync('./sekai_master/areaItems.json'));
  const gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
  const cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));

  const leaderCardId = data.userDecks[0].leader
  let leader = {}
  
  for(const idx in data.userCards) {
    if (data.userCards[idx].cardId === leaderCardId) {
      leader = data.userCards[idx]
      break
    }
  }

  const leaderCard = binarySearch(leaderCardId, 'id', cards);

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

  // Generate Text For Profile's Teams
  let teamText = ''
  Object.keys(data.userDecks[0]).forEach((pos) => {
    if (pos !== 'leader') {
      positionId = data.userDecks[0][pos]

      data.userCards.forEach((card) => {
        if (card.cardId === positionId) {
          const cardInfo = binarySearch(positionId, 'id', cards);
          const charInfo = gameCharacters[cardInfo.characterId-1]
          teamText += `__${cardInfo.prefix} ${charInfo.givenName} ${charInfo.firstName}__\n`
          teamText += `Rarity: ${'⭐'.repeat(cardInfo.rarity)}\n`
          teamText += `Type: ${COMMAND.CONSTANTS[cardInfo.attr]}\n`

          if (!private) {
            teamText += `Level: \`\`${card.level}\`\`\n`
          }

          teamText += `Master Rank: \`\`${card.masterRank}\`\`\n`

          if (cardInfo.rarity > 2) {
            let trainingText = (card.specialTrainingStatus === 'done') ? '✅' : '❌'
            teamText += `Special Training: ${trainingText}\n`
          }
        }
      })
    }
  })

  // Generate Text For Profile's Character Ranks
  let characterRankText = ''
  let maxNameLength = 0
  let maxRankLength = 0

  data.userCharacters.forEach((char) => {
    const charInfo = gameCharacters[char.characterId-1]
    let charName = charInfo.givenName
    if (charInfo.firstName) {
      charName += ` ${charInfo.firstName}`
    }
    let rankText = `Rank ${char.characterRank}`

    if (maxNameLength < charName.length) {
      maxNameLength = charName.length
    }

    if (maxRankLength < rankText.length) {
      maxRankLength = rankText.length
    }
  })

  data.userCharacters.forEach((char) => {
    const charInfo = gameCharacters[char.characterId-1]

    let charName = charInfo.givenName
    if (charInfo.firstName) {
      charName += ` ${charInfo.firstName}`
    }
    charName += ' '.repeat(maxNameLength-charName.length)

    let rankText = `Rank ${char.characterRank}` 
    rankText += ' '.repeat(maxRankLength-rankText.length)

    characterRankText += `\`\`${charName}  ${rankText}\`\`\n`
  })

  // Generate Challenge Rank Text
  let challengeRankInfo = {}
  for(let i = 0; i < data.userChallengeLiveSoloStages.length; i++) {
    const currentChallengeRank = data.userChallengeLiveSoloStages[i]
    if (!(currentChallengeRank.characterId in challengeRankInfo)) {
      challengeRankInfo[currentChallengeRank.characterId] = currentChallengeRank.rank
    } else {
      if (challengeRankInfo[currentChallengeRank.characterId] < currentChallengeRank.rank) {
        challengeRankInfo[currentChallengeRank.characterId] = currentChallengeRank.rank
      }
    }
  }

  let challengeRankText = ''
  maxNameLength = 0
  maxRankLength = 0

  Object.keys(challengeRankInfo).forEach((charId) => {
    const charInfo = gameCharacters[charId-1]
    let charName = charInfo.givenName
    if (charInfo.firstName) {
      charName += ` ${charInfo.firstName}`
    }
    let rankText = `Rank ${challengeRankInfo[charId]}`

    if (maxNameLength < charName.length) {
      maxNameLength = charName.length
    }

    if (maxRankLength < rankText.length) {
      maxRankLength = rankText.length
    }
  })

  Object.keys(challengeRankInfo).forEach((charId) => {
    const charInfo = gameCharacters[charId-1]

    let charName = charInfo.givenName
    if (charInfo.firstName) {
      charName += ` ${charInfo.firstName}`
    }
    charName += ' '.repeat(maxNameLength-charName.length)

    let rankText = `Rank ${challengeRankInfo[charId]}` 
    rankText += ' '.repeat(maxRankLength-rankText.length)

    challengeRankText += `\`\`${charName}  ${rankText}\`\`\n`
  })

  const profileEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${data.user.userGamedata.name}'s Profile`)
    .setDescription(`**Requested:** <t:${Math.floor(Date.now()/1000)}:R>`)
    .setAuthor({ 
      name: `${data.user.userGamedata.userId}`, 
      iconURL: `${leaderThumbURL}` 
    })
    .setThumbnail(leaderThumbURL)
    .addFields(
      { name: 'Name', value: `${data.user.userGamedata.name}`, inline: false },
      { name: 'User ID', value: `${data.user.userGamedata.userId}`, inline: false },
      { name: 'Rank', value: `${data.user.userGamedata.rank}`, inline: false },
      { name: 'Description', value: `${data.userProfile.word}\u200b` },
      { name: 'Twitter', value: `@${data.userProfile.twitterId}\u200b` },
      { name: 'Cards', value: `${teamText}` },
      { name: 'Character Ranks', value: `${characterRankText}\u200b` },
      { name: 'Challenge Rank', value: `${challengeRankText}\u200b`}
    )
    .setImage(leaderFullURL)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  // Hidden Because Of Sensitive Information
  if (!private) {
    let areaTexts = {}
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

      if (!(itemInfo.areaId in areaTexts)) {
        areaTexts[itemInfo.areaId] = ''
      }

      let itemText = (itemLevel.sentence).replace(/\<[\s\S]*?\>/g, "**")

      areaTexts[itemInfo.areaId] += `__${itemInfo.name}__ \`\`Lv. ${item.level}\`\`\n`
      areaTexts[itemInfo.areaId] += `${itemText}\n`
    })

    Object.keys(areaTexts).forEach((areaId) => {
      const areaInfo = binarySearch(areaId, 'id', areas);

      profileEmbed.addField(areaInfo.name, areaTexts[areaId])
    })
  }
  
  return profileEmbed 
}

const getProfile = async (interaction, discordClient, userId) => {
  discordClient.addSekaiRequest('profile', {
    userId: userId
  }, async (response) => {
    if (response.httpStatus === 404) {
      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ACC_ERR, discordClient)]
      });
      return
    }

    let private = true
    const user = discordClient.db.prepare('SELECT * FROM users WHERE sekai_id=@sekaiId').all({
      sekaiId: userId
    })

    if (user.length && !user[0].private) {
      private = false
    }

    const profileEmbed = generateProfileEmbed(discordClient, response, private)
    await interaction.editReply({
      embeds: [profileEmbed]
    });
  })
}

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),

  async execute(interaction, discordClient) {
    await interaction.deferReply()

    let accountId = ''

    if (interaction.options._hoistedOptions.length) {
      accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'')
    } else {
      const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
        discordId: interaction.user.id
      })

      if (!user.length) {
        await interaction.editReply({
          embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.NO_ACC_ERR, discordClient)]
        });
        return
      }
      accountId = user[0].sekai_id
    }

    if (!accountId) {
      // Do something because there is an empty account id input
      await interaction.editReply({
        embeds: [generateEmbed(COMMAND.INFO.name, COMMAND.CONSTANTS.BAD_ID_ERR, discordClient)]
      })
      return
    }

    getProfile(interaction, discordClient, accountId)
  }
};