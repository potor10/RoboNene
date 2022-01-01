const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../constants.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alerts')
    .setDescription('Sign up for DM alerts')
    .addStringOption(op =>
      op.setName('category')
        .setDescription('The alert category')
        .setRequired(true)
        .addChoice('Rank Loss Warnings (T100 Only)', 'rank_warning')
        .addChoice('Rank Overtaken (T100 Only)', 'rank_lost')
        .addChoice('Event Times', 'event_time'))
    .addBooleanOption(op => 
      op.setName('enable')
        .setDescription('Enable or disable the specified alert')
        .setRequired(true)),
  
  async execute(interaction, commandParams) {
    console.log(interaction);
    let alertStatus = (interaction.options._hoistedOptions[1].value) ? 1 : 0;
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