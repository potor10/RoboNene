

const getEvent = () => {
  const schedule = JSON.parse(fs.readFileSync('./schedule.json'));
  const currentTime = Date.now()
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].startAt <= currentTime && schedule[i].closedAt >= currentTime) {
      return {
        id: schedule[i].id,
        banner: 'https://sekai-res.dnaroma.eu/file/sekai-en-assets/event/' + 
          `${schedule[i].assetbundleName}/logo_rip/logo.webp`,
        name: schedule[i].name
      }
    }
  }
  return {
    id: -1,
    banner: '',
    name: ''
  }
}


module.exports = { getEvent, getRankingEvent }