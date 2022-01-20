const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { BOT_NAME, NENE_COLOR, FOOTER } = require('../../constants');

const fs = require('fs');
const path = require('path')

// Parse commands jsons in current directory
const commands = {}
const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.json'));

for (const file of commandFiles) {
  const COMMAND = require(`./${file}`);
  console.log(`Loaded command json ${COMMAND.INFO.name} from ${file}`);
  commands[COMMAND.INFO.name] = COMMAND.INFO;
}

const slashCommand = new SlashCommandBuilder().setName('help').setDescription('Get help on commands')
slashCommand.addStringOption(op => {
  op.setName('command')
  op.setDescription('The name of the command you would like information on')
  
  for(const command in commands) {
    op.addChoice(command, command)
  }

  return op
})

module.exports = {
  data: slashCommand,
  
  async execute(interaction, discordClient) {

    await interaction.reply('yikes!');
  }
};