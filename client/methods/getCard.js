const fs = require('fs');

// TODO: Binary Search instead
const getCard = (cardId) => {
  const cards = JSON.parse(fs.readFileSync('./sekai_master/cards.json'));

  let card = {
    id: -1
  }

  for(const idx in cards) {
    if (cards[idx].id === cardId) {
      card = cards[idx]
      break
    }
  }

  return card
}

module.exports = getCard