/**
 * @fileoverview Dynamically generate our slash commands from data files rather than
 * generating them on an individual basis in each file.
 * @author Potor10
 */

const { SlashCommandBuilder } = require('@discordjs/builders');

/**
 * Applies options to a specific command using SlashCommandBuilder
 * @param {SlashCommandBuilder} command the builder for the command in question
 * @param {Object} info command info provided
 */
const generateOptions = (command, info) => {
  if (info.params) {
    info.params.forEach(option => {
      const setOp = (op) => {
        op.setName(option.name)
          .setDescription(option.description)
          .setRequired(option.required)

        if (option.choices) {
          option.choices.forEach(choice => {
            op.addChoice(choice[0], choice[1])
          })
        }

        return op
      }

      if (option.type === 'string') {
        command.addStringOption(setOp)
      } else if (option.type === 'boolean') {
        command.addBooleanOption(setOp)
      } else if (option.type === 'number') {
        command.addNumberOption(setOp)
      } else if (option.type === 'channel') {
        command.addChannelOption(setOp)
      } else if (option.type === 'user') {
        command.addUserOption(setOp)
      } else if (option.type === 'integer') {
        command.addIntegerOption(setOp)
      }
    })
  }
}

/**
 * Builds a slash command using data provided
 * @param {Object} commandInfo command info provided
 */
const generateSlashCommand = (commandInfo) => {
  const slashCommand = new SlashCommandBuilder()
  
  slashCommand.setName(commandInfo.name)
  slashCommand.setDescription(commandInfo.description)

  generateOptions(slashCommand, commandInfo)

  if (commandInfo.subcommands) {
    commandInfo.subcommands.forEach(scInfo => {
      slashCommand.addSubcommand(sc => {
        sc.setName(scInfo.name)
          .setDescription(scInfo.description)
        generateOptions(sc, scInfo)

        return sc
      })
    })
  }

  return slashCommand
}

module.exports = generateSlashCommand