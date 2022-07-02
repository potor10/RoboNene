/**
 * @fileoverview The main output when users call for the /skillorder command
 * Sends a order from Left to Right for Best to Worst player skill order
 * @author Ai0796
 */

const { MessageActionRow, MessageButton } = require('discord.js');
const { BOT_NAME } = require('../../constants');

const COMMAND = require('../command_data/skillorder')

const generateSlashCommand = require('../methods/generateSlashCommand')
const generateEmbed = require('../methods/generateEmbed')
const fs = require('fs')

//Required since Proseka Skill order is not 1 2 3 4 5
const ProsekaSkillOrder = [2, 1, 4, 5, 3]

/**
 * A class designed to store music data from JSON Files
 */
class music {
    constructor() {
        this.ids = new Set()
        this.musics = new Array()
        this.musicmetas = new Object()

        const musicsJSON = JSON.parse(fs.readFileSync('./sekai_master/musics.json'));
        const musicMetasJSON = JSON.parse(fs.readFileSync('./sekai_master/music_metas.json'))

        //Checks music metas first for all IDs listed
        musicMetasJSON.forEach(music => {
            this.ids.add(music.music_id);
        });

        //Checks musics second to get listed IDs titles
        musicsJSON.forEach(music => {
            if(this.ids.has(music.id)) {
                this.musics.push([music.title, music.id])
                this.musicmetas[music.id] = new Object()
            }
        })

        let keys = Object.values(this.musics);

        //Checks music metas again now that we have titles to be used as keys
        musicMetasJSON.forEach(music => {
            if(keys.includes(music.music_id)){
                //Slice from 0 to 5 since encore (5) doesn't matter
                let skillScores = music.skill_score_multi.slice(0, 5);
                let skillScoreOrder = [];
                let skillOrder = []
                skillScores.forEach((skill, i) => {
                    skillScoreOrder.push([skill, i]);
                })

                skillScoreOrder.sort(this.sortFunction);

                skillScoreOrder.forEach(skill => {
                    skillOrder.push(ProsekaSkillOrder[skill[1]]);
                })

                this.musicmetas[music.music_id][music.difficulty] = skillOrder
            }
        })
    }

    //Sort function for skill scores
    sortFunction(a, b) {
        if (a[0] === b[0]) {
            return 0;
        }
        else {
            return (a[0] < b[0]) ? -1 : 1;
        }
    }
}

const musicData = new music()

module.exports = {
    ...COMMAND.INFO,
    data: generateSlashCommand(COMMAND.INFO),

    async execute(interaction, discordClient) {
        await interaction.reply("test")
        if (interaction.options._hoistedOptions[0]) {
            console.log(interaction.options._hoistedOptions[0].value)
        }
    }
};

