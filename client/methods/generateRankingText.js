/**
 * @fileoverview An implementation designed to efficiently generate an embed for a
 * leaderboard display, given ranking data
 * @author Potor10
 */

const { RESULTS_PER_PAGE } = require('../../constants');

/**
 * Generates an ranking embed from the provided params
 * @param {Object} data a collection of player data on the leaderboard
 * @param {Integer} page the current page (if applicable)
 * @param {Integer} target the rank that we will highlight on the embed with a star
 * @return {MessageEmbed} a generated embed of the current leaderboard
 */
const generateRankingText = (data, page, target) => {
  let maxRankLength = 0
  let maxNameLength = 0
  let maxScoreLength = 0

  data.forEach((user) => {
    if (user.rank.toString().length > maxRankLength) {
      maxRankLength = user.rank.toString().length
    }
    if (user.name.length > maxNameLength) {
      maxNameLength = user.name.length
    }
    if (user.score.toLocaleString().length > maxScoreLength) {
      maxScoreLength = user.score.toLocaleString().length
    }
  })

  let leaderboardText = '';
  for (i = 0; i < RESULTS_PER_PAGE; i++) {
    if (i > data.length) {
      leaderboardText += '\u200b';
      break;
    }

    let rank = " ".repeat(maxRankLength - data[i].rank.toString().length) + data[i].rank
    let name = data[i].name + " ".repeat(maxNameLength - data[i].name.length) 
    let score = " ".repeat(maxScoreLength - data[i].score.toLocaleString().length) + 
      data[i].score.toLocaleString()
    
    leaderboardText += `\`\`${rank} ${name} ${score}\`\``;
    if ((page * RESULTS_PER_PAGE) + i + 1 === target) {
      leaderboardText += '⭐';
    } 
    leaderboardText += '\n';
  }

  return leaderboardText
}

module.exports = generateRankingText