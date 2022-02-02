const { DIR_DATA } = require('../constants');
const https = require('https');
const fs = require('fs'); 
const regression = require('regression');

const binarySearch = require('../client/methods/binarySearch')

const RATE_CONSTANTS = {
  "AVAILABLE_RANKS": [
    1, 2, 3, 
    10, 20, 30, 40, 50, 
    100, 200, 300, 400, 500, 
    1000, 2000, 3000, 4000, 5000,
    10000, 20000, 30000, 40000, 50000
  ],
  "SEKAI_BEST_HOST": "api.sekai.best"
}

const findPreviousEvents = () => {
  const events = JSON.parse(fs.readFileSync(`${DIR_DATA}/events.json`));
  const currentTime = Date.now()

  const previousEvents = []

  for (let i = 0; i < events.length; i++) {
    if (events[i].aggregateAt < currentTime) {
      previousEvents.push({
        id: events[i].id,
        startAt: events[i].startAt,
        aggregateAt: events[i].aggregateAt,
      })
    }
  }

  return previousEvents
}

const getTimeEventClose = () => {
  const events = JSON.parse(fs.readFileSync(`${DIR_DATA}/events.json`));
  const currentTime = Date.now()

  for (let i = 0; i < events.length; i++) {
    if (events[i].startAt <= currentTime && events[i].closedAt >= currentTime) {
      return (events[i].closedAt - currentTime)
    }
  }

  return 120000
}

const generateRateInfo = (event, rankData) => {
  let halfDayIdx = -1
  let lastDayIdx = rankData.length

  // 24 hours have passed into the event
  for(let i = 0; i < rankData.length; i++) {
    const currentEventTime = (new Date(rankData[i].timestamp)).getTime()
    if (halfDayIdx === -1 && currentEventTime >= event.startAt + 43200000) {
      halfDayIdx = i
      break
    }
  }

  // less than 24 hours left in the event
  for(let i = 0; i < rankData.length; i++) {
    const currentEventTime = (new Date(rankData[i].timestamp)).getTime()
    lastDayIdx = i
    if (currentEventTime >= event.aggregateAt - 86400000) {
      break
    }
  }

  const points = []

  // Only get data points past 12 hours and before last 24 hours
  rankData.slice(halfDayIdx, lastDayIdx).forEach((point) => {
    points.push([(new Date(point.timestamp)).getTime() - event.startAt, point.score])
  })

  const model = regression.linear(points, {precision: 100});

  const finalScore = rankData[rankData.length-1].score
  const newSlope = (finalScore - model.equation[1]) / (event.aggregateAt - event.startAt)
  const slopeRate = newSlope / model.equation[0]

  return slopeRate
}

const trackRankingRate = () => {
  const rate = JSON.parse(fs.readFileSync('./rank/rate.json'));
  const previousEvents = findPreviousEvents()

  const eventCards = JSON.parse(fs.readFileSync(`${DIR_DATA}/eventCards.json`));
  const events = JSON.parse(fs.readFileSync('./sekai_master/events.json'));
  const cards = JSON.parse(fs.readFileSync(`${DIR_DATA}/cards.json`));

  const recursiveHttp = (event, idx, callback) => {
    if (idx >= RATE_CONSTANTS.AVAILABLE_RANKS.length) {
      callback()
    } else {
      const tier = RATE_CONSTANTS.AVAILABLE_RANKS[idx]

      const options = {
        host: RATE_CONSTANTS.SEKAI_BEST_HOST,
        path: `/event/${event.id}/rankings?rank=${tier}&limit=100000&region=en`,
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
              console.log(`Obtained Data For Event ${event.id} tier ${tier}`);
              const rankData = JSON.parse(json)
              rate[event.id][tier] = generateRateInfo(event, rankData.data.eventRankings);
              recursiveHttp(event, idx+1, callback)
            } catch (err) {
              // Error parsing JSON: ${err}`
              console.log(err)
            }
          } else {
            // Error retrieving via HTTPS. Status: ${res.statusCode}
            console.log(`Event ${event.id} failed with error code ${res.statusCode}`);
            callback();
          }
        });
      }).on('error', (err) => {});
    } 
  }

  const recursiveRequest = (idx) => {
    if (idx >= previousEvents.length) {
      console.log('Finished Obtaining Rate Information')
      fs.writeFileSync(`./rank/rate.json`, JSON.stringify(rate));
      return
    } else if (!rate.hasOwnProperty(previousEvents[idx].id)) {
      console.log(`Adding Rate Constant For Event ${previousEvents[idx].id}`);

      const characterIds = []

      eventCards.forEach(card => {
        if (card.eventId == previousEvents[idx].id) {
          const cardInfo = binarySearch(card.cardId, 'id', cards);
          characterIds.push(cardInfo.characterId)
        }
      })

      rate[previousEvents[idx].id] = {
        characterIds: characterIds,
        eventType: events[previousEvents[idx].id - 1].eventType
      }

      recursiveHttp(previousEvents[idx], 0, () => {recursiveRequest(idx+1)})
    } else {
      recursiveRequest(idx+1)
    }
  }

  recursiveRequest(0)

  let eta_ms = getTimeEventClose()
  console.log(`Requested Ranking Rate Constant, Sleeping for ${eta_ms + 1000} ms`)
  setTimeout(() => {trackRankingRate()}, eta_ms + 1000);
}

module.exports = trackRankingRate
