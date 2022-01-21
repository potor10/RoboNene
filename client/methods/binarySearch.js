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