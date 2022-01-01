const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cutoff')
    .setDescription('Find detailed data about the cutoff data for a certain ranking')
    .addIntegerOption(op =>
      op.setName('tier')
        .setDescription('The tier of the cutoff')
        .setRequired(true)
        .addChoice('t1', 1)
        .addChoice('t2', 2)
        .addChoice('t3', 3)
        .addChoice('t10', 10)
        .addChoice('t20', 20)
        .addChoice('t30', 30)
        .addChoice('t40', 40)
        .addChoice('t50', 50)
        .addChoice('t60', 60)
        .addChoice('t70', 70)
        .addChoice('t80', 80)
        .addChoice('t90', 90)
        .addChoice('t100', 100)
        .addChoice('t500', 500)
        .addChoice('t1000', 1000)
        .addChoice('t2000', 2000)
        .addChoice('t3000', 3000)
        .addChoice('t4000', 4000)
        .addChoice('t5000', 5000)
        .addChoice('t10000', 10000)
        .addChoice('t20000', 20000)
        .addChoice('t30000', 30000)
        .addChoice('t40000', 40000)
        .addChoice('t50000', 50000)
        .addChoice('t100000', 100000)),
  
  async execute(interaction, logging, db) {
    return;
  }
};