
const normalize = (arr) => {
  var ratio = Math.max(...arr) / 100;

  return arr.map(v => Math.round(v / ratio));
}


class Impose {
  constructor(data, shift) {
    data.sort(function (a, b) {
      return b.confidence - a.confidence;
    });

    // data.length = 10;

    this.matchArr = data;
    this.templateArr = data.map(match => match.keypoint1);
    this.frameArr = data.map(match => match.keypoint2);
    this.shift = shift;
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

  get rotationDeg() {
    var values = this.similarityTransform[0][0];
    var a = values[0];
    var b = values[1];
    return Math.round(Math.atan2(b, a) * (180 / Math.PI));
  }

  get frameTopLeftCoord() {
    return this.frameArr.reduce((result, coords) => {
      if (result[0] > coords[0] && result[1] > coords[1]) {
        return coords;
      }
      return result
    });
  }

  get frameTopRightCoord() {
    return this.frameArr.reduce((result, coords) => {
      if (result[0] < coords[0] && result[1] > coords[1]) {
        return coords;
      }
      return result
    });
  }

  get frameBottomRightCoord() {
    return this.frameArr.reduce((result, coords) => {
      if (result[0] < coords[0] && result[1] < coords[1]) {
        return coords;
      }
      return result
    });
  }

  get frameBottomLeftCoord() {
    return this.frameArr.reduce((result, coords) => {
      if (result[0] > coords[0] && result[1] < coords[1]) {
        return coords;
      }
      return result
    });
  }

  // NB: This doesn't return the actual coordinate
  // it returns the smallest X and the smallest Y.
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

  get frameCentroid() {
    let x = 0, y = 0;
    const l = this.frameArr.length;

    this.frameArr.forEach(coords => {
      x += coords[0];
      y += coords[1];
    });

    return [x / l, y / l];
  }

  get templateCentroid() {
    let x = 0, y = 0;
    const l = this.templateArr.length;

    this.templateArr.forEach(coords => {
      x += coords[0] + this.shift;
      y += coords[1];
    });

    return [x / l, y / l];
  }

  // http://mathforum.org/library/drmath/view/77932.html
  get frameTilt() {
    let posSlope = 0;
    let negSlope = 0;
    let posCount = 0;
    let negCount = 0;
    const center = this.frameCentroid;

    this.matchArr.forEach(match => {
      var frame = match.keypoint2;

      if (match.index1 < 10) {
        const s = calcSlope(frame, center);
        if (s > 0) {
          posSlope += s;
          posCount++;
        } else {
          negSlope += s;
          negCount++;
        }

        // console.log(
        //   s,
        //   frame,
        //   center,
        //   match.index1);
      }
    })


    // posSlope /= posCount || 1;
    // negSlope /= negCount || 1;

    const sign = posSlope > -1 * negSlope ? 1 : -1;

    console.log(posSlope, negSlope)

    return posSlope * (sign * negSlope) / (posCount + negCount)

    return (
      Math.sqrt(
        ((posSlope ** 2) + 1) * ((negSlope ** 2) + 1)
      ) + (posSlope * negSlope - 1))
      / (posSlope + negSlope);

    // return slope / count;
  }

  drawRect(ctx) {
    ctx.strokeStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(...this.frameTopLeft);
    ctx.lineTo(...this.frameTopRight);
    ctx.lineTo(...this.frameBottomRight);
    ctx.lineTo(...this.frameBottomLeft);
    ctx.lineTo(...this.frameTopLeft);
    ctx.stroke();
    ctx.closePath();
  }

  imposeImage(template, context, image) {

    // const context = document.createElement("canvas").getContext("2d");
    if (!template) return;

    const scale = this.similarityTransform[1];

    const { width, height } = template;

    const w = width / scale;
    const h = height / scale;

    context.save()
    // context.translate(
    //   this.frameCentroid[0] - (w / 2),
    //   this.frameCentroid[1] - (h / 2)
    // )
    // context.rotate(this.rotationDeg * Math.PI / 180);

    context.beginPath();
    context.strokeStyle = 'white';
    const rect = context.rect(
      this.frameCentroid[0] - (w / 2),
      this.frameCentroid[1] - (h / 2),
      w,
      h
    );

    context.stroke();

    // context.restore();

    // const img = new Image();
    // img.src = "./assets/ar-card-small.jpg";
    // img.crossOrigin = "Anonymous";

    // context.drawImage(
    //   img,
    //   this.frameCentroid[0] - (w / 2),
    //   this.frameCentroid[1] - (h / 2),
    //   w,
    //   h
    // );

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

const printDot = (coords, color = 'green', ctx) => {
  ctx.beginPath();
  ctx.arc(coords[0], coords[1], 3, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

const onClick = (data, context) => {
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);

  const imposer = new Impose(data);

  // console.log('Confidence Arr: ', imposer.normalizedConfidenceArr);
  // console.log('Average confidence: ', imposer.meanConfidence)

  // console.log("Tracking Data: ", data);
  console.log("Transform Data: ", imposer.similarityTransform);
  console.log("Transform Deg: ", imposer.rotationDeg);

  // printDot(imposer.frameTopLeftCoord, 'orange', context);
  // printDot(imposer.frameBottomLeftCoord, 'orange', context);
  // printDot(imposer.frameBottomRightCoord, 'orange');
  // printDot(imposer.frameTopRightCoord, 'orange');
  // printDot(imposer.frameTopLeft);
  // printDot(imposer.frameBottomLeft);
  // printDot(imposer.frameBottomRight);
  // printDot(imposer.frameTopRight);
  // printDot(imposer.frameCenter, 'pink');
  // printDot(imposer.frameCentroid, 'red');
}

const drawConnectingLines = (arr, context, shift) => {
  // var conf = match.confidence;
  // conf = conf - event.data[event.data.length - 1].confidence;
  // var confidence = conf * (1 / event.data[0].confidence);

  arr.forEach(match => {
    var template = match.keypoint1;
    var frame = match.keypoint2;
    context.beginPath();

    if (match.index1 < 10) {
      context.strokeStyle = 'red'
    } else {
      context.strokeStyle = 'green'
    }

    context.moveTo(frame[0], frame[1]);
    context.lineTo(shift + template[0], template[1]);
    context.stroke();
  })
};

const drawLine = (context, pt1, pt2) => {
  context.beginPath();
  context.moveTo(pt1[0], pt1[1]);
  context.lineTo(pt2[0], pt2[1]);
  context.strokeStyle = 'orange'
  context.stroke();
}

const calcSlope = (pt, center) => {
  return (-pt[1] + center[1]) / (pt[0] - center[0]);
};

// 2.460784313725491(2)[173, 130](2)[186, 161.99019607843138]

console.log(
  (1.30 - 1.62) /
  (1.73 - 1.86)
)