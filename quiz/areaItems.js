/**
 * @fileoverview A collection of questions involving area items for the quiz
 * @author Potor10
 */

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