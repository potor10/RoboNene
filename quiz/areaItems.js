module.exports = [
  {
    'attr': 'areaName',
    'name': (item) => {
      return item.areaName
    },
    'prompt': (item) => {
      return `Where can you find \`\`${item.name}\`\`?`
    }
  },
  {
    'attr': 'areaName',
    'name': (item) => {
      return item.name
    },
    'prompt': (item) => {
      return `Which item can be found in \`\`${item.areaName}\`\`?`
    }
  }
]