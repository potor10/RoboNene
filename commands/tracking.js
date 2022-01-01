const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  adminOnly: true,
  data: new SlashCommandBuilder()
    .setName('tracking')
    .setDescription('Add a tracking post to a server')
    .addChannelOption(op => 
      op.setName('channel')
        .setDescription('The channel you want your tracking updates to go in')
        .setRequired(true))
    .addIntegerOption(op =>
      op.setName('time')
        .setDescription('How frequently the tracking updates')
        .setRequired(true)
        .addChoice('2 minutes', 2)
        .addChoice('1 hour', 60))
    .addBooleanOption(op => 
      op.setName('enable')
        .setDescription('Enable or disable the tracking alerts')
        .setRequired(true)),
  
  async execute(interaction, commandParams) {
    console.log(interaction);
    let alertStatus = (interaction.options._hoistedOptions[2].value) ? 1 : 0;
    
    switch (interaction.options._hoistedOptions[0].value) {
      case 'rank_warning':
        commandParams.db.prepare('UPDATE users SET rank_warning=@alertStatus WHERE discord_id=@discordId').run({
          discordId: interaction.user.id,
          alertStatus: alertStatus
        });
        await interaction.reply({
          content: `Success! Alerts ${(alertStatus) ? 'enabled' : 'disabled'} ` + 
            'for rank loss warnings.',
          ephemeral: true 
        });
        break;
      case 'rank_lost':
        commandParams.db.prepare('UPDATE users SET rank_lost=@alertStatus WHERE discord_id=@discordId').run({
          discordId: interaction.user.id,
          alertStatus: alertStatus
        });
        await interaction.reply({
          content: `Success! Alerts ${(alertStatus) ? 'enabled' : 'disabled'} ` + 
            'for when your rank is overtaken.',
          ephemeral: true 
        });
        break;
      case 'event_time':
        commandParams.db.prepare('UPDATE users SET event_time=@alertStatus WHERE discord_id=@discordId').run({
          discordId: interaction.user.id,
          alertStatus: alertStatus,
        });
        await interaction.reply({
          content: `Success! Alerts ${(alertStatus) ? 'enabled' : 'disabled'} ` + 
            'for events.',
          ephemeral: true 
        });
        break;
      default:
        await interaction.reply({
          content: ERR_COMMAND,
          ephemeral: true 
        });
    }
  }
};