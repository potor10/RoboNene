const { DMChannel } = require('discord.js');
const generateEmbed = require('../methods/generateEmbed') 

const INTERACTION_CONST = {
  "NO_ACCESS_ADMIN": {
    type: 'Error',
    message: "You can not access this command.\nPlease make sure you have " + 
      "\`\`Administrator\`\` or \`\`Manage Server\`\` permissions."
  },

  "NO_ACCESS_LINK": {
    type: 'Error',
    message: "You can not access this command until you link your Discord to a Project Sekai account.\nUse /link to begin."
  }
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, discordClient) {
    if (!interaction.isCommand()) return;

    discordClient.logger.log({
      level: 'info',
      timestamp: Date.now(),
      discord_id: interaction.user.id,
      discord_name: `${interaction.user.username}#${interaction.user.discriminator}`,
      guild_id: interaction.guildId,
      guild_name: interaction.channel instanceof DMChannel ? interaction.channel.recipient.username : interaction.member.guild.name,
      command: interaction.commandName,
      subcommand: interaction.options._subcommand,
      inputs: interaction.options._hoistedOptions
    });

    const interactionIdx = discordClient.commands
      .map(c => c.data.name)
      .indexOf(interaction.commandName);
    
    if (interactionIdx != -1) {
      const command = discordClient.commands[interactionIdx]

      if (command.adminOnly) {
        // Check for server manager / administrate perms
        let permissions = interaction.member.permissions
        if (!permissions.has('ADMINISTRATOR') && !permissions.has('MANAGE_GUILD')) {
          await interaction.reply({
            embeds: [
              generateEmbed({
                name: command.data.name, 
                content: INTERACTION_CONST.NO_ACCESS_ADMIN, 
                client: discordClient.client
              })
            ],
            ephemeral: true 
          });
          return
        }
      }
      
      if (command.requiresLink) {
        const request = discordClient.db.prepare('SELECT * FROM users ' +
          'WHERE discord_id=@discordId').all({
          discordId: interaction.user.id
        });
        if (request.length === 0) {
          await interaction.reply({
            embeds: [
              generateEmbed({
                name: command.data.name, 
                content: INTERACTION_CONST.NO_ACCESS_LINK, 
                client: discordClient.client
              })
            ],
            ephemeral: true 
          });

          return;
        }
      }
      
      await command.execute(interaction, discordClient);
    }
  }
};