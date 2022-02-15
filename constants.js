module.exports = {
  // Bot Information
  "BOT_NAME": "Robo Nene",
  "BOT_ACTIVITY": () => {
    let activities = [
      "Beep Boop in ", 
      "Dreaming in ", 
      "Badmouthing "
    ];
    return activities[Math.floor(Math.random() * (activities.length - 1))]
  },

  // Default Error Shared Between Most Commands
  "ERR_COMMAND": {
    type: 'Error',
    message: "Could not understand your command, please try again!"
  },

  // Rich Embed Information
  "NENE_COLOR": "#34DD9A",
  "FOOTER": "Robo Nene",

  // Results per page on leaderboard embeds (1-20)
  "RESULTS_PER_PAGE": 20,

  // Max Requests Per Account Per Hour (120 ~1 request every 30 seconds)
  "RATE_LIMIT": 120,

  // Source of game data
  "DIR_DATA": "./sekai_master",
}