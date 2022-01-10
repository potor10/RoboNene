const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER, DIR_DATA } = require('../constants');
const { sekaiDiffHost, sekaiDiffPath, includeJson } = require('../config.json')
const https = require('https');
const fs = require('fs');

const sendAlert = async (updateTime, discordClient) => {
  const banner = 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' +
    `${updateTime.event.assetbundleName}/logo_rip/logo.webp`

  const eventAlert = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${updateTime.event.name}`)
    .setDescription(`<t:${Math.floor(updateTime.time/1000)}> - <t:${Math.floor(updateTime.time/1000)}:R>`)
    .addField(updateTime.title, updateTime.text)
    .setThumbnail(banner)
    .setTimestamp()
    .setFooter(FOOTER, discordClient.client.user.displayAvatarURL());

  const alertedUsers = await discordClient.db.prepare('SELECT * FROM users WHERE event_time=1').all()
  alertedUsers.forEach((target) => {
    discordClient.client.users.fetch(target.discord_id, false).then((user) => {
      user.send({ embeds: [eventAlert] });
     });
  });

}

const getNextAlert = (discordClient) => {
  const currentTime = Date.now()
  let schedule = {}
  try {
    schedule = JSON.parse(fs.readFileSync(`${DIR_DATA}/events.json`));
  } catch (err) {
    return 10
  }

  let currentEventIdx = -1;
  let nextEventIdx = -1;

  // Identify current event and next event index
  for (let i = 0; i < schedule.length; i++) {
    if (Math.floor(schedule[i].closedAt / 1000) > Math.floor(currentTime / 1000) &&
      Math.floor(schedule[i].startAt / 1000) < Math.floor(currentTime / 1000)) {
      currentEventIdx = i;
    }
    if (Math.floor(schedule[i].startAt / 1000) > Math.floor(currentTime / 1000)) {
      if (nextEventIdx === -1) {
        nextEventIdx = i;
      } else if (Math.floor(schedule[i].startAt / 1000) < 
        Math.floor(schedule[nextEventIdx].startAt / 1000)) {
        nextEventIdx = i;
      }
    }
  }

  if (nextEventIdx === -1) {
    console.log(`Idk next start`)
    return 120000
  }

  const currentEventEnd = new Date(schedule[currentEventIdx].aggregateAt)
  const nextEventStart = new Date(schedule[nextEventIdx].startAt)

  const eventTimes = [
    // Current Ranking End - 30 Minutes Before
    {
      name: "Current Ranking End - 30 Minutes Before",
      event: schedule[currentEventIdx],
      time: new Date(currentEventEnd).setMinutes(currentEventEnd.getMinutes() - 30),
      title: `Ranking will end soon soon`,
      text: `30 Minutes before the event Ranking Ends`
    },
    // Current Ranking End
    {
      name: "Current Ranking End",
      event: schedule[currentEventIdx],
      time: currentEventEnd.getTime(),
      title: `Ranking Has Ended`,
      text: `Ranking Has Ended, Hope You Did Well!`
    },
    // Next Event Start - 30 Minutes Before
    {
      name: "Next Event Start - 30 Minutes Before",
      event: schedule[nextEventIdx],
      time: new Date(nextEventStart).setMinutes(nextEventStart.getMinutes() - 30),
      title: `Next event is beginning soon`,
      text: `30 Minutes before the next event starts`
    },
    // Next Event Start
    {
      name: "Next Event Start",
      event: schedule[nextEventIdx],
      time: nextEventStart.getTime(),
      title: `Next event has started`,
      text: `Good luck tiering!`
    }
  ]

  for(const updateIdx in eventTimes) {
    if (currentTime < eventTimes[updateIdx].time) {
      const eta_ms = eventTimes[updateIdx].time - Date.now()
      console.log(`Next Update: ${eventTimes[updateIdx].name}`)
      setTimeout(() => {sendAlert(eventTimes[updateIdx], discordClient)}, eta_ms);
      return eta_ms
    }
  }
};

const getData = (dir=DIR_DATA) => {
  includeJson.forEach((filename) => {
    const options = {
      host: sekaiDiffHost,
      path: `${sekaiDiffPath}${filename}.json`,
      headers: {'User-Agent': 'request'}
    };
  
    https.get(options, (res) => {
      let json = '';
      res.on('data', (chunk) => {
        json += chunk;
      });
      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            fs.writeFileSync(`${dir}/${filename}.json`, JSON.stringify(JSON.parse(json)));
          } catch (err) {
            // Error parsing JSON: ${err}`
          }
        } else {
          // Error retrieving via HTTPS. Status: ${res.statusCode}
        }
      });
    }).on('error', (err) => {});
  })
}

const trackGameData = (discordClient) => {
  // Obtain the game data
  getData();
  
  // Run the next alerts
  const eta_ms = getNextAlert(discordClient)

  // wait a bit longer before grabbing the next schedule (to prevent time misalignment)
  setTimeout(() => {trackGameData(discordClient)}, eta_ms + 10000);
}

module.exports = trackGameData;