const { SlashCommandBuilder } = require('@discordjs/builders');
const getRank = require('../methods/getRank')

// TODO 
// Update reply to be embed

const RANK_CONSTANTS = {
  'NO_ACC_ERROR': 'Error! This user does not have an account with the bot',
};

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Display your current ranking on the leaderboard')
    .addUserOption(op =>
      op.setName('user')
        .setDescription('Discord user')
        .setRequired(false)),
  
  async execute(interaction, discordClient) {
    const target = (interaction.options._hoistedOptions.length) ? 
      interaction.options._hoistedOptions[0].value :
      interaction.user.id
    
    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: target
    })

    if (user.length === 0) {
      await interaction.reply({
        content: RANK_CONSTANTS.NO_ACC_ERROR,
        ephemeral: true 
      });
      return
    }

    getRank(interaction, discordClient, {
      targetUserId: user[0].sekai_id
    })
  }
};