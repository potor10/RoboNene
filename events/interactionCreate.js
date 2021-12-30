const { NO_ACCESS } = require('../constants.json');

module.exports = {
  name: "interactionCreate",
  async execute(interaction, commands, userDb, eventDb, logger) {
    if (!interaction.isCommand()) return;

    logger.log({
      level: 'info',
      discord_id: interaction.user.id,
      discord_name: `${interaction.user.username}#${interaction.user.discriminator}`,
      guild_id: interaction.guildId,
      guild_name: interaction.member.guild.name,
      time: Date.now(),
      command: interaction.commandName,
      subcommand: interaction.options._subcommand,
      inputs: interaction.options._hoistedOptions
    });

    const interactionIdx = commands.map(c => c.data.name).indexOf(interaction.commandName)
    if (interactionIdx != -1) {
      if (commands[interactionIdx].requiresLink) {
        const request = userDb.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
          discordId: interaction.user.id
        })
        if (request.length === 0) {
          await interaction.reply({
            content: NO_ACCESS,
            ephemeral: true 
          });

          return;
        }
      } 
      await commands[interactionIdx].execute(interaction, logger, userDb, eventDb)
    }

    //console.log(interaction);
  }
}