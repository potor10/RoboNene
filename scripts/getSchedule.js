const https = require('https');
const fs = require('fs');

const getNextReset = (currentDate) => {
  const nextReset = new Date();
  nextReset.setUTCHours(12);
  nextReset.setUTCMilliseconds(0);
  nextReset.setUTCMinutes(0);
  nextReset.setUTCSeconds(0);

  if (nextReset < currentDate) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  return nextReset;
};

const getSchedule = (logger) => {
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

  let nextReset = getNextReset(new Date());
  let eta_ms = nextReset.getTime() - Date.now();
  console.log(`Schedule Retrieved, Pausing For ${eta_ms} ms`);
  setTimeout(() => {getSchedule(logger)}, eta_ms);
};

module.exports = getSchedule;