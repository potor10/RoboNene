/**
 * @fileoverview The main output when users call for the /quiz command
 * Contains various classes designed to pool information from the master db and
 * dynamically generate questions for the user.
 * Also contains the main method of user access to the quiz, and randomly selection
 * of a category.
 * @author Potor10
 */

const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const fs = require('fs');

const COMMAND = require('../command_data/quiz')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed') 

/**
 * Shuffles array in place.
 * @param {Array} a An array containing the items.
 * @return {Array} an array that has been shuffled 
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

/**
 * A class designed to obtain questions from existing event data
 */
class eventQuestion {
  constructor() {
    this.type = 'events';
    this.events = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
    this.prompts = require('../../quiz/event')
  }

  /**
   * Obtain the type of entry we are looking for (question specific)
   * @return the question's type of prompt
   */
  getType() {
    return this.type
  }

  /**
   * Obtain a question prompt, 3 incorrect and 1 correct answers
   * @return {Object} a collection of the aforementioned values
   */
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

/**
 * A class designed to obtain questions from existing character data
 */
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
  
  /**
   * Obtain the type of entry we are looking for (question specific)
   * @return the question's type of prompt
   */
  getType() {
    return this.type
  }

  /**
   * Obtain a question prompt, 3 incorrect and 1 correct answers
   * @return {Object} a collection of the aforementioned values
   */
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

    // Recursively sample random characters until a character w/o the same trait is found
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

/**
 * A class designed to obtain questions from existing card data
 */
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

  /**
   * Obtain the type of entry we are looking for (question specific)
   * @return the question's type of prompt
   */
  getType() {
    return this.type
  }

  /**
   * Obtain a question prompt, 3 incorrect and 1 correct answers
   * @return {Object} a collection of the aforementioned values
   */
  getQuestion() {
    const cardShuffle = shuffle(this.cardInfo)

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    // Recursively sample random characters until a character w/o the same trait is found
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

/**
 * A class designed to obtain questions from area item data
 */
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

  /**
   * Obtain the type of entry we are looking for (question specific)
   * @return the question's type of prompt
   */
  getType() {
    return this.type
  }

  /**
   * Obtain a question prompt, 3 incorrect and 1 correct answers
   * @return {Object} a collection of the aforementioned values
   */
  getQuestion() {
    // Remove duplicates of Music Speakers from the pool
    const areaShuffle = shuffle(this.areaItemInfo).filter((area) => {
      return area.name !== 'Music Speakers'
    })

    const wrong = []
    const questionIdx = Math.floor(Math.random() * this.prompts.length)
    const attr = this.prompts[questionIdx].attr

    // Recursively sample random characters until a character w/o the same trait is found
    const chooseAreaItem = () => {
      const areaItem = areaShuffle.pop()

      while (wrong.length < 3) {
        const incorrectAreaItem = areaShuffle.pop()
        if (incorrectAreaItem[attr] !== areaItem[attr]) {
          let attrExists = false
          let attrValue =  this.prompts[questionIdx].name(incorrectAreaItem)

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

/**
 * Obtain the account statistics of the user (if it exists)
 * @param {String} userId the Id of the user using the quiz
 * @param {DiscordClient} discordClient the client we are using to serve requests
 * @return {Object} an object containing the overall stats of the user
 */
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

    const interactionSec = Math.round(COMMAND.CONSTANTS.INTERACTION_TIME / 1000)
    
    const content = {
      type: questionCreator.getType(),
      message: prompt + `\n*You have ${interactionSec} seconds to answer this question*`
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
        const content = {
          type: COMMAND.CONSTANTS.QUESTION_TIMEOUT_TYPE,
          message: `${question.prompt}\nCorrect Answer: \`\`${question.right}\`\`\n\n` +
            COMMAND.CONSTANTS.QUESTION_TIMEOUT_MSG
        }

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