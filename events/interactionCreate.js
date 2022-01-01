const { BOT_ADMIN_IDS, NO_ACCESS_ADMIN, NO_ACCESS_LINK } = require('../constants.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, interactionParams) {
    if (!interaction.isCommand()) return;

    interactionParams.logger.log({
      level: 'info',
      discord_id: interaction.user.id,
      discord_name: `${interaction.user.username}#${interaction.user.discriminator}`,
      guild_id: interaction.guildId,
      guild_name: interaction.member.guild.name,
      time: Date.now(),
      command: interaction.commandName,
      subcommand: interaction.options._subcommand,
      inputs: interaction.options._hoistedOptions,
      timestamp: Date.now()
    });

    const interactionIdx = interactionParams.commands
      .map(c => c.data.name)
      .indexOf(interaction.commandName);
    
    if (interactionIdx != -1) {
      if (interactionParams.commands[interactionIdx].adminOnly) {
        if (!(BOT_ADMIN_IDS.includes(interaction.user.id))) {
          await interaction.reply({
            content: NO_ACCESS_ADMIN,
            ephemeral: true 
          });

          return;
        }
      }
      
      if (interactionParams.commands[interactionIdx].requiresLink) {
        const request = interactionParams.db.prepare('SELECT * FROM users ' +
          'WHERE discord_id=@discordId').all({
          discordId: interaction.user.id
        });
        if (request.length === 0) {
          await interaction.reply({
            content: NO_ACCESS_LINK,
            ephemeral: true 
          });

          return;
        }
      }
      await interactionParams.commands[interactionIdx].execute(interaction, {
        client: interactionParams.client,
        logger: interactionParams.logger, 
        db: interactionParams.db,
        api: interactionParams.api
      });
    }

    //console.log(interaction);
  }
};