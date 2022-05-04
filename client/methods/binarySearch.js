/**
 * @fileoverview An implementation of a binary search used to efficiently search
 * through game data provided in JSON format (since it's pre sorted)
 * @author Potor10
 */

/**
 * A simple binary search 
 * @param {Integer} id the id of the card we're looking for
 * @param {String} property the property of the Object we're looking at
 * @param {Object} data a large collection of game data that we are trying to search through
 * @return {Object} the card information that matches the id
 */
const binarySearch = (id, property, data) => {
  let start = 0;
  let end = data.length-1;

  while(start <= end) {
    let mid = Math.floor((start + end) / 2);

    if (data[mid][property] == id) {
      return data[mid];
    } else if (data[mid][property] < id) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
}

module.exports = binarySearch