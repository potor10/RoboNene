const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');

const COMMAND = require('../command_data/quiz')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
const shuffle = (a) => {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

class eventQuestion {
  constructor() {
    this.type = 'events';
    this.events = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
    this.prompts = require('../../quiz/event')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const eventShuffle = shuffle(this.events)

    const event = eventShuffle.pop()
    const wrong = [eventShuffle.pop().name, eventShuffle.pop().name, eventShuffle.pop().name]
    const questionIdx = Math.floor(Math.random() * this.prompts.length)

    const question = {
      right: event.name,
      wrong: wrong,
      prompt: this.prompts[questionIdx].prompt(event)
    }

    return question
  }
}

class characterQuestion {
  constructor() {
    this.type = 'characters';
    this.characterProfiles = JSON.parse(fs.readFileSync('./sekai_master/characterProfiles.json'));
    this.gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
    this.characterInfo = []

    for(let idx in this.characterProfiles) {
      this.characterInfo.push({
        ...this.gameCharacters[idx],
        ...this.characterProfiles[idx]
      })
    }

    this.prompts = require('../../quiz/characters')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const charaShuffle = shuffle(this.characterInfo)

    const getName = (character) => {
      let charName = character.givenName
      if (character.firstName) {
        charName += ` ${character.firstName}`
      }
      return charName
    }

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    const chooseCharacter = () => {
      const character = charaShuffle.pop()

      if (!character[attr]) { 
        return chooseCharacter() 
      } else {
        while (wrong.length < 3) {
          const incorrectChar = charaShuffle.pop()
          if (incorrectChar[attr] && incorrectChar[attr] !== character[attr]) {
            wrong.push(getName(incorrectChar))
          }
        }

        return {
          right: getName(character),
          wrong: wrong,
          prompt: this.prompts[questionIdx].prompt(character)
        }
      }
    }

    return chooseCharacter()
  }
}

class cardQuestion {
  constructor() {
    this.type = 'cards';
    this.cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));
    this.gameCharacters = JSON.parse(fs.readFileSync('./sekai_master/gameCharacters.json'));
    this.cardInfo = []

    for(let idx in this.cards) {
      this.cardInfo.push({
        ...this.cards[idx],
        firstName: this.gameCharacters[this.cards[idx].characterId-1].firstName,
        givenName: this.gameCharacters[this.cards[idx].characterId-1].givenName,
      })
    }

    this.prompts = require('../../quiz/cards')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const cardShuffle = shuffle(this.cardInfo)

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    const chooseCard = () => {
      const card = cardShuffle.pop()

      while (wrong.length < 3) {
        const incorrectCard = cardShuffle.pop()
        if (incorrectCard[attr] !== card[attr]) {
          let attrExists = false
          let attrValue =  this.prompts[questionIdx].name(incorrectCard)

          for (const wrongIdx in wrong) {
            if (wrong[wrongIdx] === attrValue) {
              attrExists = true
              break
            }
          }

          if (!attrExists) {
            wrong.push(attrValue)
          }
        }
      }

      return {
        right: this.prompts[questionIdx].name(card),
        wrong: wrong,
        prompt: this.prompts[questionIdx].prompt(card)
      }
    }

    return chooseCard()
  }
}

class areaQuestion {
  constructor() {
    this.type = 'cards';
    this.areas = JSON.parse(fs.readFileSync('./sekai_master/areas.json'));
    this.areaItems = JSON.parse(fs.readFileSync('./sekai_master/areaItems.json'));
    this.areaItemInfo = []

    for(let areaItemIdx in this.areaItems) {
      let areaName = 'N/A'
      for(let areaIdx in this.areas) {
        if (this.areas[areaIdx].id === this.areaItems[areaItemIdx].areaId) {
          areaName = this.areas[areaIdx].name
          break;
        }
      }

      this.areaItemInfo.push({
        ...this.areaItems[areaItemIdx],
        areaName: areaName
      })
    }

    this.prompts = require('../../quiz/areaItems')
  }

  getType() {
    return this.type
  }

  getQuestion() {
    const areaShuffle = shuffle(this.areaItemInfo)

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    const chooseAreaItem = () => {
      const areaItem = areaShuffle.pop()

      while (wrong.length < 3) {
        const incorrectAreaItem = areaShuffle.pop()
        if (incorrectAreaItem[attr] !== areaItem[attr]) {
          let attrExists = false
          let attrValue =  this.prompts[questionIdx].name(incorrectAreaItem)
          console.log(attrValue)

          for (const wrongIdx in wrong) {
            if (wrong[wrongIdx] === attrValue) {
              attrExists = true
              break
            }
          }

          if (!attrExists) {
            wrong.push(attrValue)
          }
        }
      }

      return {
        right: this.prompts[questionIdx].name(areaItem),
        wrong: wrong,
        prompt: this.prompts[questionIdx].prompt(areaItem)
      }
    }

    return chooseAreaItem()
  }
}

const getAccount = (userId, discordClient) => {
  // Obtain our user stats
  const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
    discordId: userId
  })

  let account = null
  if (user.length) {
    account = user[0]
  }

  return account
}

module.exports = {
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })

    // Init our question generators
    const questions = [
      new eventQuestion(), 
      new characterQuestion(), 
      new cardQuestion(), 
      new areaQuestion()
    ]

    // Obtain a random question
    const questionCreator = (questions[Math.floor(Math.random() * questions.length)])
    const question = questionCreator.getQuestion()
    let prompt = question.prompt + '\n'

    // Set our correct answer to be a random index (out of 4)
    const correctIdx = Math.floor(Math.random() * 3)
    const answerOptions = []

    for(let i = 0; i < 4; i++) {
      let answer = question.right
      if (i !== correctIdx) {
        answer = question.wrong.pop()
      } 
      answerOptions.push({
        label: answer,
        value: answer,
        emoji: COMMAND.CONSTANTS[i+1]
      })

      prompt += `${COMMAND.CONSTANTS[i+1]} \`\`${answer}\`\`\n`
    }
  
    console.log(answerOptions)

    // Initialize our question selection menu
    const questionSelect = new MessageActionRow()
      .addComponents(new MessageSelectMenu()
          .setCustomId(`quiz`)
          .setPlaceholder('Select Your Answer!')
          .addOptions(answerOptions))

    const content = {
      type: questionCreator.getType(),
      message: prompt
    }

    const quizMessage = await interaction.editReply({ 
      embeds: [
        generateEmbed({
          name: COMMAND.INFO.name, 
          content: content, 
          client: discordClient.client
        })
      ],
      components: [questionSelect],
      fetchReply: true
    });

    const filter = i => { return i.customId === `quiz` }

    const collector = quizMessage.createMessageComponentCollector({ 
      filter, 
      time: COMMAND.CONSTANTS.INTERACTION_TIME 
    })

    let answered = false;

    collector.on('collect', async (i) => {
      // Determine if we have the correct user
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: COMMAND.CONSTANTS.WRONG_USER_ERR, 
              client: discordClient.client
            })
          ],
          ephemeral: true
        })
        return
      } else {
        // Right user has answered the prompt
        answered = true
      }

      let content = {
        type: '',
        message: `${question.prompt}\nYour Answer: \`\`${i.values[0]}\`\`\nCorrect Answer: \`\`${question.right}\`\`\n\n`
      }
  
      let account = getAccount(interaction.user.id, discordClient)

      // Initialize correct if we have an account
      let correct = (account) ? account.quiz_correct : 0
      
      if (i.values[0] === question.right) {
        if (account) {
          // Update our user with the new values
          discordClient.db.prepare('UPDATE users SET quiz_correct=@quizCorrect, ' + 
            'quiz_question=@quizQuestion WHERE discord_id=@discordId').run({
            quizCorrect: account.quiz_correct + 1,
            quizQuestion: account.quiz_question + 1,
            discordId: interaction.user.id
          })
        }

        // Append message content
        content.type = COMMAND.CONSTANTS.QUESTION_RIGHT_TYPE
        content.message += COMMAND.CONSTANTS.QUESTION_RIGHT_MSG
        correct++
      } else {
        if (account) {
          // Update our user db with the new values
          discordClient.db.prepare('UPDATE users SET quiz_question=@quizQuestion ' + 
            'WHERE discord_id=@discordId').run({
            quizQuestion: account.quiz_question + 1,
            discordId: interaction.user.id
          })
        }

        // Append message content
        content.type = COMMAND.CONSTANTS.QUESTION_WRONG_TYPE
        content.message += COMMAND.CONSTANTS.QUESTION_WRONG_MSG
      }

      if (account) {
        // Output our user statistics
        content.message += `\n\nQuestions Correct: \`\`${correct}\`\``
        content.message += `\nQuestions Answered: \`\`${account.quiz_question + 1}\`\``
        content.message += `\nAccuracy: \`\`${+((correct / (account.quiz_question + 1)) * 100).toFixed(2)}%\`\``
      } else {
        content.message += `\n\n ${COMMAND.CONSTANTS.LINK_MSG}`
      }

      interaction.editReply({
        embeds: [
          generateEmbed({
            name: COMMAND.INFO.name, 
            content: content, 
            client: discordClient.client
          })
        ],
        components: []
      })

    })

    collector.on('end', async (collected) => {
      if (!answered) {
        console.log(`Collected ${collected.size} items`)

        // If the user has not answered the question yet
        const content = { ... COMMAND.CONSTANTS.NO_RESPONSE }

        let account = getAccount(interaction.user.id, discordClient)

        if (account) {
          discordClient.db.prepare('UPDATE users SET quiz_question=@quizQuestion ' + 
            'WHERE discord_id=@discordId').run({
            quizQuestion: account.quiz_question + 1,
            discordId: interaction.user.id
          })

          content.message += `\n\nQuestions Correct: \`\`${account.quiz_correct}\`\``
          content.message += `\nQuestions Answered: \`\`${account.quiz_question + 1}\`\``
          content.message += `\nAccuracy: \`\`${+((account.quiz_correct / (account.quiz_question + 1)) * 100).toFixed(2)}%\`\``
        } else {
          content.message += `\n\n ${COMMAND.CONSTANTS.LINK_MSG}`
        }

        await interaction.editReply({
          embeds: [
            generateEmbed({
              name: COMMAND.INFO.name, 
              content: content, 
              client: discordClient.client
            })
          ],
          components: []
        })
      }
    });
  }
}