/**
 * @fileoverview The main output when users call for the /profile command
 * Creates and returns an embed with all of the user's information available ingame
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const fs = require('fs');

const COMMAND = require('../command_data/profile')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 
const binarySearch = require('../methods/binarySearch')

/**
 * Generates an embed for the profile of the player
 * @param {DiscordClient} client we are using to interact with disc
 * @param {String} userId the id of the user we are trying to access
 * @param {Object} data the player data returned from the API acess of the user in question
 * @param {boolean} private if the play has set their profile to private (private by default)
 * @return {MessageEmbed} the embed we will display to the user
 */
const generateProfileEmbed = (discordClient, userId, data, private) => {
  const areas = JSON.parse(fs.readFileSync('./sekai_master/areas.json'));
  const areaItemLevels = JSON.parse(fs.readFileSync('./sekai_master/areaItemLevels.json'));
  const areaItems = JSON.parse(fs.readFileSync('./sekai_master/areaItems.json'));
  const gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
  const cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));

  const cardRarities = {
    'rarity_1': '🌟',
    'rarity_2': '🌟🌟',
    'rarity_3': '🌟🌟🌟',
    'rarity_4': '🌟🌟🌟🌟',
    'rarity_birthday': '🎀',
  };

  const specialTrainingPossible = [
    'rarity_3',
    'rarity_4',
  ];

  const leaderCardId = data.userDecks[0].leader
  let leader = {}
  
  for(const idx in data.userCards) {
    if (data.userCards[idx].cardId === leaderCardId) {
      leader = data.userCards[idx]
      break
    }
  }

  const leaderCard = binarySearch(leaderCardId, 'id', cards);

  let leaderThumbURL = 'https://storage.sekai.best/sekai-assets/' + 
    `thumbnail/chara_rip/${leaderCard.assetbundleName}`

  let leaderFullURL = 'https://storage.sekai.best/sekai-assets/' + 
    `character/member/${leaderCard.assetbundleName}_rip/`


  if (leader.defaultImage === 'special_training') {
    leaderThumbURL += '_after_training.webp'
    leaderFullURL += 'card_after_training.webp'
  } else {
    leaderThumbURL += '_normal.webp'
    leaderFullURL += 'card_normal.webp'
  }

  // Generate Text For Profile's Teams
  let teamText = ''
  Object.keys(data.userDecks[0]).forEach((pos) => {
    if (pos !== 'leader' && pos !== 'subLeader') {
      positionId = data.userDecks[0][pos]

      data.userCards.forEach((card) => {
        if (card.cardId === positionId) {
          const cardInfo = binarySearch(positionId, 'id', cards);
          const charInfo = gameCharacters[cardInfo.characterId-1]
          teamText += `__${cardInfo.prefix} ${charInfo.givenName} ${charInfo.firstName}__\n`
          teamText += `${cardRarities[cardInfo.cardRarityType]}\n`
          teamText += `Type: ${COMMAND.CONSTANTS[cardInfo.attr]}\n`

          if (!private) {
            teamText += `Level: \`\`${card.level}\`\`\n`
          }

          teamText += `Master Rank: \`\`${card.masterRank}\`\`\n`

          if (specialTrainingPossible.includes(cardInfo.cardRarityType)) {
            let trainingText = (card.specialTrainingStatus === 'done') ? '✅' : '❌'
            teamText += `Special Training: ${trainingText}\n`
          }
        }
      })
    }
  })

  // Get Challenge Rank Data for all characters
  let challengeRankInfo = {};
  for (let i = 0; i < data.userChallengeLiveSoloStages.length; i++) {
    const currentChallengeRank = data.userChallengeLiveSoloStages[i];
    if (!(currentChallengeRank.characterId in challengeRankInfo)) {
      challengeRankInfo[currentChallengeRank.characterId] = currentChallengeRank.rank;
    } else {
      if (challengeRankInfo[currentChallengeRank.characterId] < currentChallengeRank.rank) {
        challengeRankInfo[currentChallengeRank.characterId] = currentChallengeRank.rank;
      }
    }
  }

  // Generate Text For Profile's Character Ranks

  let nameTitle = 'Name';
  let crTitle = 'CR';
  let chlgTitle = 'CHLG';

  let maxNameLength = nameTitle.length;
  let maxCRLength = crTitle.length;
  let maxCHLGLength = chlgTitle.length;

  // Get Max Lengths for each column
  data.userCharacters.forEach((char) => {
    const charInfo = gameCharacters[char.characterId-1];
    let charName = charInfo.givenName;
    if (charInfo.firstName) {
      charName += ` ${charInfo.firstName}`;
    }
    let rankText = `${char.characterRank}`;

    let chlgText = '0';
    if (char.characterId in challengeRankInfo) {
      chlgText = `${challengeRankInfo[char.characterId]}`;
    }

    if (maxNameLength < charName.length) {
      maxNameLength = charName.length;
    }

    if (maxCRLength < rankText.length) {
      maxCRLength = rankText.length;
    }
    
    if (maxCHLGLength < chlgText.length) {
      maxCHLGLength = chlgText.length;
    }
  });

  // Set column headers
  nameTitle = nameTitle + ' '.repeat(maxNameLength-nameTitle.length);
  crTitle = ' '.repeat(maxCRLength - crTitle.length) + crTitle;
  chlgTitle = ' '.repeat(maxCHLGLength - chlgTitle.length) + chlgTitle;

  let CRCHLGRankText = `\`${nameTitle} ${crTitle} ${chlgTitle}\`\n`;


  // Add each character's rank and Challenge show to the text
  data.userCharacters.forEach((char) => {
    const charInfo = gameCharacters[char.characterId -1];

    let charName = charInfo.givenName;
    if (charInfo.firstName) {
      charName += ` ${charInfo.firstName}`;
    }
    let rankText = `${char.characterRank}`;
    let chlgText = '0';
    if (char.characterId in challengeRankInfo) {
      chlgText = `${challengeRankInfo[char.characterId]}`;
    }
    charName += ' '.repeat(maxNameLength-charName.length);
    rankText = ' '.repeat(maxCRLength-rankText.length) + rankText;
    chlgText = ' '.repeat(maxCHLGLength-chlgText.length) + chlgText;

    CRCHLGRankText += `\`\`${charName} ${rankText} ${chlgText}\`\`\n`;
  });

  // Create the Embed for the profile using the pregenerated values
  const profileEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${data.user.userGamedata.name}'s Profile`)
    .setDescription(`**Requested:** <t:${Math.floor(Date.now()/1000)}:R>`)
    .setAuthor({ 
      name: `${userId}`, 
      iconURL: `${leaderThumbURL}` 
    })
    .setThumbnail(leaderThumbURL)
    .addFields(
      { name: 'Name', value: `${data.user.userGamedata.name}`, inline: false },
      { name: 'User ID', value: `${userId}`, inline: false },
      { name: 'Rank', value: `${data.user.userGamedata.rank}`, inline: false },
      { name: 'Description', value: `${data.userProfile.word}\u200b` },
      { name: 'Twitter', value: `@${data.userProfile.twitterId}\u200b` },
      { name: 'Cards', value: `${teamText}` },
      { name: 'Character & Challenge Ranks', value: `${CRCHLGRankText}\u200b` }
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

/**
 * Makes a request to Project Sekai to obtain the information of the player
 * @param {Interaction} interaction class provided via discord.js
 * @param {DiscordClient} client we are using to interact with disc
 * @param {Integer} userId the id of the user we are trying to access
 */
const getProfile = async (interaction, discordClient, userId) => {
  if (!discordClient.checkRateLimit(interaction.user.id)) {
    await interaction.editReply({
      embeds: [generateEmbed({
        name: COMMAND.INFO.name,
        content: { 
          type: COMMAND.CONSTANTS.RATE_LIMIT_ERR.type, 
          message: COMMAND.CONSTANTS.RATE_LIMIT_ERR.message + 
            `\n\nExpires: <t:${Math.floor(discordClient.getRateLimitRemoval(interaction.user.id) / 1000)}>`
        },
        client: discordClient.client
      })]
    })
    return
  }

  discordClient.addSekaiRequest('profile', {
    userId: userId
  }, async (response) => {
    let private = true
    const user = discordClient.db.prepare('SELECT * FROM users WHERE sekai_id=@sekaiId').all({
      sekaiId: userId
    })

    if (user.length && !user[0].private) {
      private = false
    }

    const profileEmbed = generateProfileEmbed(discordClient, userId, response, private)
    await interaction.editReply({
      embeds: [profileEmbed]
    });
  }, async (err) => {
    // Log the error
    discordClient.logger.log({
      level: 'error',
      timestamp: Date.now(),
      message: err.toString()
    })

    if (err.getCode() === 404) {
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.BAD_ACC_ERR, 
            client: discordClient.client
          })
        ]
      });
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

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),

  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })

    let accountId = ''

    if (interaction.options._hoistedOptions.length) {
      accountId = (interaction.options._hoistedOptions[0].value).replace(/\D/g,'')
    } else {
      const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
        discordId: interaction.user.id
      })

      if (!user.length) {
        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.NO_ACC_ERR, 
              client: discordClient.client
            })
          ]
        });
        return
      }
      accountId = user[0].sekai_id
    }

    if (!accountId) {
      // Do something because there is an empty account id input
      await interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: COMMAND.CONSTANTS.BAD_ID_ERR, 
            client: discordClient.client
          })
        ]
      })
      return
    }

    getProfile(interaction, discordClient, accountId)
  }
};