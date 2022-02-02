module.exports = [
  {
    'attr': 'areaName',
    'prompt': (card) => {
      return `Where can you find \`\`${card.name}\`\`?`
    }
  },
  {
    'attr': 'areaName',
    'prompt': (card) => {
      return `Which item can be found in \`\`${card.areaName}\`\`?`
    }
  }
]