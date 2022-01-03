const { BOT_ADMIN_IDS } = require('../../constants.json');

const INTERACTION_CONST = {
  "NO_ACCESS_ADMIN": "You can not access this command.",
  "NO_ACCESS_LINK": "You can not access this command until you link your Discord to a Project Sekai account. Use /link to begin."
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

      if (command.adminOnly) {
        if (!(BOT_ADMIN_IDS.includes(interaction.user.id))) {
          await interaction.reply({
            content: INTERACTION_CONST.NO_ACCESS_ADMIN,
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
            content: INTERACTION_CONST.NO_ACCESS_LINK,
            ephemeral: true 
          });

          return;
        }
      }
      
      await command.execute(interaction, discordClient);
    }

    //console.log(interaction);
  }
};