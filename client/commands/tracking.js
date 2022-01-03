const { SlashCommandBuilder } = require('@discordjs/builders');
const { ERR_COMMAND } = require('../../constants.json');

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
    console.log(JSON.stringify(interaction.options))

    const channelData = interaction.options._hoistedOptions[0]
    if (channelData.channel.type !== 'GUILD_TEXT') {
      await interaction.reply({
        content: 'Error! The channel you have selected is not a valid text channel',
        ephemeral: true 
      });

      return
    }

    if (interaction.options._hoistedOptions[2].value) {
      commandParams.db.prepare('INSERT INTO tracking (guild_id, channel_id, tracking_type) ' + 
        'VALUES (@guildId, @channelId, @trackingType)').run({
        guildId: channelData.channel.guildId,
        channelId: channelData.value,
        trackingType: interaction.options._hoistedOptions[1].value
      });
      await interaction.reply({
        content: `Success! ${interaction.options._hoistedOptions[1].value} min ` + 
          'tracking alerts enabled in ' +
          `channel #${channelData.channel.name}.`,
        ephemeral: true 
      });
    } else {
      const query = commandParams.db.prepare('DELETE FROM tracking WHERE ' + 
        'guild_id=@guildId AND channel_id=@channelId AND tracking_type=@trackingType').run({
          guildId: channelData.channel.guildId,
          channelId: channelData.value,
        trackingType: interaction.options._hoistedOptions[1].value
      });
    
      if (query.changes === 1) {
        await interaction.reply({
          content: `Success! ${interaction.options._hoistedOptions[1].value} min ` + 
            'tracking alerts disabled in ' +
            `channel #${channelData.channel.name}.`,
          ephemeral: true 
        });
      } else {
        await interaction.reply({
          content: 'Error! There are no tracking alerts for these parameters',
          ephemeral: true 
        });
      }
    }
  }
};