const { MessageEmbed } = require('discord.js');
const { NENE_COLOR, FOOTER } = require('../constants.json');
const https = require('https');
const fs = require('fs');

const sendAlert = async (alertParams) => {
  const banner = 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' +
    `${alertParams.event.assetbundleName}/logo_rip/logo.webp`

  const eventAlert = new MessageEmbed()
    .setColor(NENE_COLOR)
    .setTitle(`${alertParams.event.name}`)
    .setDescription(`<t:${alertParams.eventTime}> - <t:${alertParams.eventTime}:R>`)
    .addField(alertParams.title, alertParams.text)
    .setThumbnail(banner)
    .setTimestamp()
    .setFooter(FOOTER, alertParams.client.user.displayAvatarURL());

  const alertedUsers = await alertParams.db.prepare('SELECT * FROM users WHERE event_time=1').all()
  alertedUsers.forEach((target) => {
    alertParams.client.users.fetch(target.discord_id, false).then((user) => {
      user.send({ embeds: [eventAlert] });
     });
  });

}

const getNextAlert = (client, db) => {
  const currentTime = Date.now()
  const schedule = JSON.parse(fs.readFileSync('./schedule.json'));

  let currentEventIdx = -1;
  let nextEventIdx = -1;

  for (let i = 0; i < schedule.length; i++) {
    if (Math.floor(schedule[i].closedAt / 1000) > Math.floor(currentTime / 1000) &&
      Math.floor(schedule[i].startAt / 1000) < Math.floor(currentTime / 1000)) {
      currentEventIdx = i;
    }
    if (Math.floor(schedule[i].startAt / 1000) > Math.floor(currentTime / 1000)) {
      if (nextEventIdx == -1) {
        nextEventIdx = i;
      } else if (Math.floor(schedule[i].startAt / 1000) < 
        Math.floor(schedule[nextEventIdx].startAt / 1000)) {
        nextEventIdx = i;
      }
    }
  }

  let alertParams = {
    client: client,
    db: db
  }

  const curEventRankingEnd30MinEarly = new Date(schedule[currentEventIdx].aggregateAt);
  curEventRankingEnd30MinEarly.setMinutes(curEventRankingEnd30MinEarly.getMinutes() - 30)
  if (currentTime < curEventRankingEnd30MinEarly) {
    let eta_ms = curEventRankingEnd30MinEarly.getTime() - Date.now();
    console.log(`Next schedule check at 30 minutes before event ranking ends, Pausing For ${eta_ms} ms`);

    alertParams.event = schedule[currentEventIdx]
    alertParams.eventTime = Math.floor(schedule[currentEventIdx].aggregateAt/1000)
    alertParams.title = `Ranking will end soon soon`
    alertParams.text = `30 Minutes before the event Ranking Ends`

    setTimeout(() => {sendAlert(alertParams)}, eta_ms);
    return eta_ms
  }

  const curEventRankingEnd = new Date(schedule[currentEventIdx].aggregateAt);
  if (currentTime < curEventRankingEnd) {
    let eta_ms = curEventRankingEnd.getTime() - Date.now();
    console.log(`Next schedule check at event ranking end, Pausing For ${eta_ms} ms`);

    alertParams.event = schedule[currentEventIdx]
    alertParams.eventTime = Math.floor(schedule[currentEventIdx].aggregateAt/1000)
    alertParams.title = `Ranking Has Ended`
    alertParams.text = `Ranking Has Ended, Hope You Did Well!`

    setTimeout(() => {sendAlert(alertParams)}, eta_ms);
    return eta_ms
  }

  const nextEventStart30MinEarly = new Date(schedule[nextEventIdx].startAt);
  nextEventStart30MinEarly.setMinutes(nextEventStart30MinEarly.getMinutes() - 30)
  if (currentTime < nextEventStart30MinEarly) {
    let eta_ms = nextEventStart30MinEarly.getTime() - Date.now();
    console.log(`Next schedule check at 30 minutes before next event starts, Pausing For ${eta_ms} ms`);

    alertParams.event = schedule[nextEventIdx]
    alertParams.eventTime = Math.floor(schedule[nextEventIdx].startAt/1000)
    alertParams.title = `Next event is beginning soon`
    alertParams.text = `30 Minutes before the next event starts`

    setTimeout(() => {sendAlert(alertParams)}, eta_ms);
    return eta_ms
  }

  const nextEventStart = new Date(schedule[nextEventIdx].startAt);
  if (currentTime < nextEventStart) {
    let eta_ms = nextEventStart.getTime() - Date.now();
    console.log(`Next schedule check at next event start, Pausing For ${eta_ms} ms`);

    alertParams.event = schedule[nextEventIdx]
    alertParams.eventTime = Math.floor(schedule[nextEventIdx].startAt/1000)
    alertParams.title = `Next event has started`
    alertParams.text = `Good luck tiering!`

    setTimeout(() => {sendAlert(alertParams)}, eta_ms);
    return eta_ms
  }
};

const getSchedule = (logger, client, db) => {
  const options = {
    host: 'raw.githubusercontent.com',
    path: '/Sekai-World/sekai-master-db-en-diff/main/events.json',
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
          fs.writeFileSync('./schedule.json', JSON.stringify(JSON.parse(json)));
        } catch (err) {
          logger.log({
            level: 'error',
            message: `Error parsing JSON: ${err}`
          });
        }
      } else {
        logger.log({
          level: 'error',
          message: `Error retrieving via HTTPS. Status: ${res.statusCode}`
        });
      }
    });
  }).on('error', (err) => {
    logger.log({
      level: 'error',
      message: `Error: ${err}`
    });
  });

  logger.log({
    level: 'info',
    message: 'Retrieved schedule data',
    timestamp: Date.now()
  });

  // Run the next alerts
  const eta_ms = getNextAlert(client, db)

  // wait a bit longer before grabbing the next schedule
  setTimeout(() => {getSchedule(logger, client, db)}, eta_ms + 10000);
};

module.exports = getSchedule;