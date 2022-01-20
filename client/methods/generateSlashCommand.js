const { SlashCommandBuilder } = require('@discordjs/builders');

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


const generateSlashCommand = (commandInfo) => {
  const slashCommand = new SlashCommandBuilder()
  
  slashCommand.setName(commandInfo.name)
  slashCommand.setDescription(commandInfo.description)

  generateOptions(slashCommand, commandInfo)

  if (slashCommand.subcommands) {
    slashCommand.subcommands.forEach(scInfo => {
      slashCommand.addSubcommand(sc => {
        sc.setName(scInfo.name)
          .setDescription(scInfo.description)
        generateOptions(sc, scInfo)
      })
    })
  }

  return slashCommand
}

module.exports = generateSlashCommand