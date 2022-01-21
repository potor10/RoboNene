const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');

const fs = require('fs');

const COMMAND_NAME = 'help'

const generateEmbed = require('../methods/generateEmbed') 

const HELP_CONSTANTS = {
  'BAD COMMAND': {
    type: 'Error',
    message: 'There was a problem in finding your specified command'
  }
}

// Parse commands jsons in current directory
const commands = {}
const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.json'));

for (const file of commandFiles) {
  const COMMAND = require(`./${file}`);
  console.log(`Loaded json ${COMMAND.INFO.name} from ${file}`);
  commands[COMMAND.INFO.name] = COMMAND.INFO;
}

const slashCommand = new SlashCommandBuilder()
  .setName(COMMAND_NAME)
  .setDescription('Get help on commands')

slashCommand.addStringOption(op => {
  op.setName('command')
  op.setDescription('The name of the command you would like information on')
  op.setRequired(true)
  
  for(const command in commands) {
    op.addChoice(command, command)
  }

  return op
})

const generateOptions = (commandInfo, commandName) => {
  let optStr = `\n\`\`/${commandName}`

  if (commandInfo.params) {
    commandInfo.params.forEach(op => {
      optStr += ` [${op.name}]`
    })
  }

  optStr += `\`\`\n${commandInfo.description}\n`

  if (commandInfo.params) {
    commandInfo.params.forEach(op => {
      optStr += `\n\`\`[${op.name}]\`\`\n`
      optStr += `**Type:** \`\`${op.type.charAt(0).toUpperCase() + op.type.slice(1)}\`\`\n`
      optStr += `**Required:** \`\`${(op.required) ? 'Yes' : 'No'}\`\`\n`
      optStr += `**Description:** ${op.description}\n`
    })
  }

  return optStr
}

const generateHelpEmbed = (commandInfo, discordClient) => {
  const helpEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(COMMAND_NAME.charAt(0).toUpperCase() + COMMAND_NAME.slice(1))
    .setThumbnail(discordClient.client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());
  
  let helpText = ''

  if (commandInfo.subcommands) {
    helpText += `${commandInfo.description}\n`
    commandInfo.subcommands.forEach(sc => {
      helpText += generateOptions(sc, `${commandInfo.name} ${sc.name}`)
    })
  } else {
    helpText += generateOptions(commandInfo, commandInfo.name)
  }

  helpEmbed.addField(commandInfo.name.charAt(0).toUpperCase() + commandInfo.name.slice(1), helpText)

  return helpEmbed
}

module.exports = {
  data: slashCommand,
  
  async execute(interaction, discordClient) {
    if (!(commands.hasOwnProperty(interaction.options._hoistedOptions[0].value))) {
      await interaction.reply({
        embeds: [generateEmbed(COMMAND_NAME, HELP_CONSTANTS.BAD_COMMAND, discordClient)]
      })
      return
    }

    await interaction.reply({
      embeds: [generateHelpEmbed(commands[interaction.options._hoistedOptions[0].value], discordClient)]
    });
  }
};