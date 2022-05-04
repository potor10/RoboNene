/**
 * @fileoverview A collection of questions involving events for the quiz
 * @author Potor10
 */

module.exports = [
  {
    'prompt': (event) => {
      return `Which event began on <t:${Math.floor(event.startAt/1000)}>?`
    }
  },
  {
    'prompt': (event) => {
      return `Which event's ranking period ended on <t:${Math.floor(event.aggregateAt/1000)}>?`
    }
  },
  {
    'prompt': (event) => {
      return `Which event closed on <t:${Math.floor(event.closedAt/1000)}>?`
    }
  }
]