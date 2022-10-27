/**
 * @fileoverview The main output when users call for the /schedule command
 * Generates a embed showing current & future events based on datamined information
 * @author Potor10
 */

const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../../constants');
const fs = require('fs');

const COMMAND = require('../command_data/schedule')

const generateSlashCommand = require('../methods/generateSlashCommand');
const { DateTime } = require('luxon');

/**
* Obtains the time of the next daily reset in game
* @param {Date} currentDate the Date object of the current date time
* @return {Integer} the epochseconds of the next daily reset in game
*/
const getNextReset = (currentDate) => {

  var nextReset = DateTime.now().setZone("America/Los_Angeles");
  nextReset = nextReset.set({
    hour: 4,
    minutes: 0,
    seconds: 0,
    millisecond: 0
  });

  if (nextReset < currentDate) {
    nextReset = nextReset.set({
      day: nextReset.day + 1
    });
  }

  return Math.floor(nextReset.toSeconds());
};

/**
* Creates an embed of the current schedule data provided
* @param {Object} data the current datamined schedule & event information
* @param {DiscordClient} client the Discord Client we are recieving / sending requests to
* @return {MessageEmbed} the embed that we will display to the user
*/
const createScheduleEmbed = (data, client) => {
  let currentDate = new Date();
  let nextReset = getNextReset(currentDate);
  let currentEventIdx = -1;
  let nextEventIdx = -1;

  for (let i = 0; i < data.length; i++) {
    if (Math.floor(data[i].closedAt / 1000) > Math.floor(currentDate / 1000) &&
      Math.floor(data[i].startAt / 1000) < Math.floor(currentDate / 1000)) {
      currentEventIdx = i;
    }
    if (Math.floor(data[i].startAt / 1000) > Math.floor(currentDate / 1000)) {
      if (nextEventIdx == -1) {
        nextEventIdx = i;
      } else if (Math.floor(data[i].startAt / 1000) < Math.floor(data[nextEventIdx].startAt / 1000)) {
        nextEventIdx = i;
      }
    }
  }

  let scheduleEmbed = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle('Event Schedule')
    .setDescription('')
    .addFields(
      { name: '**__Next Daily Reset__**', value: `<t:${nextReset}> - <t:${nextReset}:R>` },
      { name: '** **', value: '** **' },
    )
    .setTimestamp()
    .setFooter(FOOTER, client.user.avatar_url);

  // Determine if there is a event currently going on
  if (currentEventIdx !== -1) {
    let startTime = Math.floor(data[currentEventIdx].startAt / 1000);
    let aggregateTime = Math.floor(data[currentEventIdx].aggregateAt / 1000);

    scheduleEmbed.addFields(
      { name: '**__Event (Current)__**', value: `${data[currentEventIdx].name} *[${data[currentEventIdx].eventType}]*` },
      { name: 'Event Started', value: `<t:${startTime}> - <t:${startTime}:R>` },
      { name: 'Ranking Closes', value: `<t:${aggregateTime}> - <t:${aggregateTime}:R>` },
    );

    scheduleEmbed.setThumbnail('https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' + 
      `${data[currentEventIdx].assetbundleName}/logo_rip/logo.webp`)
  }

  // Determine if there is the next event in the future (closest)
  if (nextEventIdx !== -1) {
    if (currentEventIdx !== -1) { scheduleEmbed.addField('** **','** **');}

    let startTime = Math.floor(data[nextEventIdx].startAt / 1000);
    let aggregateTime = Math.floor(data[nextEventIdx].aggregateAt / 1000);

    scheduleEmbed.addFields(
      { name: '**__Event (Next)__**', value: `${data[nextEventIdx].name} *[${data[nextEventIdx].eventType}]*` },
      { name: 'Event Starts', value: `<t:${startTime}> - <t:${startTime}:R>` },
      { name: 'Ranking Closes', value: `<t:${aggregateTime}> - <t:${aggregateTime}:R>` },
    );
  }

  return scheduleEmbed;
};

module.exports = {
  ...COMMAND.INFO,
  data: generateSlashCommand(COMMAND.INFO),
  
  async execute(interaction, discordClient) {
    await interaction.deferReply({
      ephemeral: COMMAND.INFO.ephemeral
    })

    const events = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
    const scheduleEmbed = createScheduleEmbed(events, discordClient.client);
    await interaction.editReply({ embeds: [scheduleEmbed] });
  }    
};