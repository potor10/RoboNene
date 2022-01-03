const { RESULTS_PER_PAGE } = require('../../constants');

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
    if (user.score.toString().length > maxScoreLength) {
      const commaAmt = Math.floor(user.score.toString().length / 3)
      maxScoreLength = user.score.toString().length + commaAmt
    }
  })

  let leaderboardText = '';
  for (i = 0; i < RESULTS_PER_PAGE; i++) {
    let rank = " ".repeat(maxRankLength - data[i].rank.toString().length) + data[i].rank
    let name = data[i].name + " ".repeat(maxNameLength - data[i].name.length) 
    let score = " ".repeat(maxScoreLength - data[i].score.toLocaleString().length) + 
      data[i].score.toLocaleString()
    
    leaderboardText += `\`\`${rank} ${name}  ${score}\`\``;
    if ((page * RESULTS_PER_PAGE) + i + 1 === target) {
      leaderboardText += '⭐';
    } 
    leaderboardText += '\n';
  }

  return leaderboardText
}

module.exports = generateRankingText