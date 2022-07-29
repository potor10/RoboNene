/**
 * @fileoverview An implementation designed to efficiently generate an embed for a
 * skill display, give a list of skill orders
 * @author Ai0796
 */

const { RESULTS_PER_PAGE } = require('../../constants');

/**
 * Generates an ranking embed from the provided params
 * @param {Array} Array of Difficulty Names
 * @param {Array} Array of Skill Orders, should be same length as difficulties
 * @return {MessageEmbed} a generated embed of the current leaderboard
 */
const generateSkillText = (difficulties, skillOrders) => {
    let maxDifficultyLength = 0;
    let maxSkillOrderLength = 0;

    difficulties.forEach((v, i) => {
        let difficulty = difficulties[i];
        let skillOrder = skillOrders[i];
        maxDifficultyLength = Math.max(maxDifficultyLength, difficulty.length);
        maxSkillOrderLength = Math.max(maxSkillOrderLength, skillOrder.length);
    });

    let skillOrderText = '';
    for (let i = 0; i < RESULTS_PER_PAGE; i++) {
        if (i >= difficulties.length) {
            skillOrderText += '\u200b';
            break;
        }

        let difficultyStr = difficulties[i] + ' '.repeat(maxDifficultyLength - difficulties[i].length);
        let skillOrderStr = ' '.repeat(maxSkillOrderLength - skillOrders[i].length) + skillOrders[i];

        skillOrderText += `\`\`${difficultyStr} ${skillOrderStr}\`\``;
        skillOrderText += '\n';
    }

    return skillOrderText;
};

module.exports = generateSkillText;