const { adminIds } = require('../../config.json');

const generateEmbed = require('../methods/generateEmbed') 

const INTERACTION_CONST = {
  "NO_ACCESS_ADMIN": {
    type: 'Error',
    message: "You can not access this command."
  },

  "NO_ACCESS_LINK": {
    type: 'Error',
    message: "You can not access this command until you link your Discord to a Project Sekai account. Use /link to begin."
  }
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, discordClient) {
    if (!interaction.isCommand()) return;

    discordClient.logger.log({
      level: 'info',
      discord_id: interaction.user.id,
      discord_name: `${interaction.user.username}#${interaction.user.discriminator}`,
      guild_id: interaction.guildId,
      guild_name: interaction.member.guild.name,
      command: interaction.commandName,
      subcommand: interaction.options._subcommand,
      inputs: interaction.options._hoistedOptions,
      timestamp: Date.now()
    });

    const interactionIdx = discordClient.commands
      .map(c => c.data.name)
      .indexOf(interaction.commandName);
    
    if (interactionIdx != -1) {
      const command = discordClient.commands[interactionIdx]

      // TODO: Check for server manager / administrate perms instead of within certain ids
      if (command.adminOnly) {
        if (!(adminIds.includes(interaction.user.id))) {
          await interaction.reply({
            embeds: [generateEmbed(command.data.name, INTERACTION_CONST.NO_ACCESS_ADMIN, discordClient)],
            ephemeral: true 
          });

          return;
        }
      }
      
      if (command.requiresLink) {
        const request = discordClient.db.prepare('SELECT * FROM users ' +
          'WHERE discord_id=@discordId').all({
          discordId: interaction.user.id
        });
        if (request.length === 0) {
          await interaction.reply({
            embeds: [generateEmbed(command.data.name, INTERACTION_CONST.NO_ACCESS_LINK, discordClient)],
            ephemeral: true 
          });

          return;
        }
      }
      
      await command.execute(interaction, discordClient);
    }
  }
};