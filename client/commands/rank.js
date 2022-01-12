const { SlashCommandBuilder } = require('@discordjs/builders');

const COMMAND_NAME = 'rank'

const getRank = require('../methods/getRank')
const generateDeferredResponse = require('../methods/generateDeferredResponse') 
const generateEmbed = require('../methods/generateEmbed') 

const RANK_CONSTANTS = {
  'NO_ACC_ERROR': {
    type: 'Error',
    message: 'This user has not linked their project sekai account with the bot.'
  },
};

module.exports = {
  requiresLink: true,
  data: new SlashCommandBuilder()
    .setName(COMMAND_NAME)
    .setDescription('Display your current ranking on the leaderboard')
    .addUserOption(op =>
      op.setName('user')
        .setDescription('Discord user')
        .setRequired(false)),
  
  async execute(interaction, discordClient) {
    const deferredResponse = await interaction.reply({
      embeds: [generateDeferredResponse(COMMAND_NAME, discordClient)],
      fetchReply: true
    })

    const target = (interaction.options._hoistedOptions.length) ? 
      interaction.options._hoistedOptions[0].value :
      interaction.user.id
    
    const user = discordClient.db.prepare('SELECT * FROM users WHERE discord_id=@discordId').all({
      discordId: target
    })

    if (user.length === 0) {
      await deferredResponse.edit({
        embeds: [generateEmbed(COMMAND_NAME, RANK_CONSTANTS.NO_ACC_ERROR, discordClient)]
      });
      return
    }

    getRank(COMMAND_NAME, deferredResponse, discordClient, {
      targetUserId: user[0].sekai_id
    })
  }
};