const sortByConfidence = (data) => {
  // Sorts best matches by confidence.
  return data.slice(0).sort(function (a, b) {
    return b.confidence - a.confidence;
  });
};

const frameCentroid = (arr) => {
  let x = 0, y = 0;
  const l = arr.length;

  arr.forEach(coords => {
    x += coords[0];
    y += coords[1];
  });

  return [x / l, y / l];
}

window.utils2 = {
  sortByConfidence,
  frameCentroid
}