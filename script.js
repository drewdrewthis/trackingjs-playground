
const normalize = (arr) => {
  var ratio = Math.max(...arr) / 100;

  return arr.map(v => Math.round(v / ratio));
}


class Impose {
  constructor(data) {
    data.sort(function (a, b) {
      return b.confidence - a.confidence;
    });

    data.length = 10;

    this.matchArr = data;

    this.templateArr = data.map(match => match.keypoint1);
    this.frameArr = data.map(match => match.keypoint2);
  }

  get confidenceArr() {
    const arr = this.matchArr;

    return arr.map(match => {
      var conf = match.confidence;
      conf = conf - arr[arr.length - 1].confidence;
      return conf;
      return (1 / arr[0].confidence) * conf;
    });
  }

  get normalizedConfidenceArr() {
    return normalize(this.confidenceArr);
  }

  get meanConfidence() {
    return this.normalizedConfidenceArr.reduce((acc, curr) => {
      return acc + curr

    }, 0) / this.confidenceArr.length;
  }

  get similarityTransform() {
    return tracking.LBF.similarityTransform_(
      this.templateArr,
      this.frameArr
    );
  }

  get frameTopLeft() {
    var minX = Infinity, minY = Infinity;

    this.frameArr.forEach(coords => {
      minX = minX > coords[0] ? coords[0] : minX;
      minY = minY > coords[1] ? coords[1] : minY;
    });

    return [minX, minY];
  }

  get frameBottomLeft() {
    var minX = Infinity, maxY = 0;

    this.frameArr.forEach(coords => {
      minX = minX > coords[0] ? coords[0] : minX;
      maxY = maxY < coords[1] ? coords[1] : maxY;
    });

    return [minX, maxY];
  }

  get frameBottomRight() {
    var maxX = 0, maxY = 0;

    this.frameArr.forEach(coords => {
      maxX = maxY < coords[0] ? coords[0] : maxY;
      maxY = maxY < coords[1] ? coords[1] : maxY;
    });

    return [maxX, maxY];
  }

  get frameTopRight() {
    var maxX = 0, minY = Infinity;

    this.frameArr.forEach(coords => {
      maxX = maxX < coords[0] ? coords[0] : maxX;
      minY = minY > coords[1] ? coords[1] : minY;
    });

    return [maxX, minY];
  }

  get frameCenter() {

    return calcMidPoint(
      calcMidPoint(this.frameTopLeft, this.frameTopRight),
      calcMidPoint(this.frameBottomLeft, this.frameBottomRight),
    );
  }
}

const calcMidValue = (a, b) => {
  const sorted = [a, b].sort();

  return ((sorted[1] - sorted[0]) / 2) + sorted[0];
}

const calcMidPoint = (a, b) => {
  const x = calcMidValue(a[0], b[0]);
  const y = calcMidValue(a[1], b[1]);

  return [x, y];
}

const printDot = (coords, color = 'green') => {
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");

  context.beginPath();
  context.arc(coords[0], coords[1], 3, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
}


const onClick = (data, context) => {
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);

  const imposer = new Impose(data);

  console.log('Confidence Arr: ', imposer.normalizedConfidenceArr);
  console.log('Average confidence: ', imposer.meanConfidence)

  // console.log("Tracking Data: ", data);
  // console.log("Transform Data: ", imposer.similarityTransform);

  printDot(imposer.frameTopLeft);
  printDot(imposer.frameBottomLeft);
  printDot(imposer.frameBottomRight);
  printDot(imposer.frameTopRight);
  printDot(imposer.frameCenter, 'red');
}