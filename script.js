
let capturing = false;

function startTracker(
  video,
  canvas,
  templateImageData,
  onTrack
) {
  var context = canvas.getContext("2d");

  // ObjectTracker ======================================================
  const ObjectTracker = function () {
    ObjectTracker.base(this, "constructor");
  }

  tracking.inherits(ObjectTracker, tracking.Tracker);

  ObjectTracker.prototype.templateDescriptors_ = null;
  ObjectTracker.prototype.templateKeypoints_ = null;
  ObjectTracker.prototype.fastThreshold = 20;
  ObjectTracker.prototype.blur = 1.1;

  ObjectTracker.prototype.setTemplate = function (pixels, width, height) {
    var blur = tracking.Image.blur(pixels, width, height, 3);
    var grayscale = tracking.Image.grayscale(blur, width, height);
    this.templateKeypoints_ = tracking.Fast.findCorners(
      grayscale,
      width,
      height
    );
    this.templateDescriptors_ = tracking.Brief.getDescriptors(
      grayscale,
      width,
      this.templateKeypoints_
    );
  };

  ObjectTracker.prototype.track = function (pixels, width, height) {
    var blur = tracking.Image.blur(pixels, width, height, this.blur);
    var grayscale = tracking.Image.grayscale(blur, width, height);
    var keypoints = tracking.Fast.findCorners(
      grayscale,
      width,
      height,
      this.fastThreshold
    );
    var descriptors = tracking.Brief.getDescriptors(
      grayscale,
      width,
      keypoints
    );
    this.emit("track", {
      data: tracking.Brief.reciprocalMatch(
        this.templateKeypoints_,
        this.templateDescriptors_,
        keypoints,
        descriptors
      )
    });
  };

  // Track ===================================================================


  var tracker = new ObjectTracker();

  tracker.on("track", (event) => {
    // requestFrame();
    onTrack(event, context);
  });

  var trackerTask = tracking.track(video, tracker, {
    camera: true,
    environment: "user"
  });

  // Waits for the user to accept the camera.
  trackerTask.stop();

  trackerTask.stop();
  tracker.setTemplate(
    templateImageData.data,
    templateImageData.width,
    templateImageData.height
  );
  trackerTask.run();

  // Sync video ============================================================


};

window.addEventListener('click', () => {
  capturing = !capturing;
})

function videoTemplateTrack() {
  // Get ImageData
  const ctx = document.createElement("canvas").getContext("2d");
  const image = new Image();

  image.onload = () => {
    // Get Template Image
    ctx.drawImage(image, 0, 0);
    width = image.width;
    height = image.height;
    templateImageData = ctx.getImageData(0, 0, width, height);
    console.log("Image Loaded: ", templateImageData);

    var boxLeft = video.width;

    function requestFrame(context) {
      window.requestAnimationFrame(function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            context.drawImage(video, 0, 0, video.width, video.height);
          } catch (err) { }
        }

        // requestFrame();
      });
    };

    startTracker(
      document.getElementById("video"),
      document.getElementById("canvas"),
      templateImageData,
      function (event, context) {
        requestFrame(context);

        if (capturing) {
          return;
        }

        var context = canvas.getContext("2d");

        trackingData = event.data;

        // Re - draws template on canvas.
        // context.putImageData(templateImageData, boxLeft, 0);

        // Plots lines connecting matches.
        event.data.forEach(match => {
          var conf = match.confidence;
          conf = conf - event.data[event.data.length - 1].confidence;
          var confidence = conf * (1 / event.data[0].confidence);

          var template = match.keypoint1;
          var frame = match.keypoint2;
          context.beginPath();
          context.strokeStyle = 'red'
          context.moveTo(frame[0], frame[1]);
          context.lineTo(boxLeft + template[0], template[1]);
          context.stroke();
        });
      }
    );
  };

  image.crossOrigin = "Anonymous";
  image.src = "assets/ar-card-small.jpg";
}

function staticTrack(sourceId, canvasId) {
  // Get ImageData
  const ctx = document.createElement("canvas").getContext("2d");
  const image = new Image();

  image.onload = () => {
    // Get Template Image
    ctx.drawImage(image, 0, 0);
    width = image.width;
    height = image.height;
    templateImageData = ctx.getImageData(0, 0, width, height);
    console.log("Image Loaded: ", templateImageData);

    const sourceImage = document.getElementById(sourceId);
    // const context = document.getElementById("canvas2").getContext('2d');

    const canvas = document.getElementById(canvasId);
    canvas.getContext('2d').drawImage(sourceImage, 0, 0, video.width, video.height);

    // context.putImageData(templateImageData, sourceImage.width, 0);

    startTracker(
      sourceImage,
      canvas,
      templateImageData,
      function (event, context) {
        var boxLeft = sourceImage.width;
        // if (capturing) {
        //   return;
        // }

        trackingData = event.data;

        // Re - draws template on canvas.
        context.putImageData(templateImageData, boxLeft, 0);

        // Plots lines connecting matches.
        event.data.forEach(match => {
          var conf = match.confidence;
          conf = conf - event.data[event.data.length - 1].confidence;
          var confidence = conf * (1 / event.data[0].confidence);

          var template = match.keypoint1;
          var frame = match.keypoint2;
          context.beginPath();
          context.strokeStyle = 'red'
          context.moveTo(frame[0], frame[1]);
          context.lineTo(boxLeft + template[0], template[1]);
          context.stroke();
        });
      }
    );
  };

  image.crossOrigin = "Anonymous";
  image.src = "assets/ar-card-small.jpg";
}

window.addEventListener('load', () => {
  videoTemplateTrack();
  staticTrack('sourceImage', 'canvas2');
  staticTrack('sourceImage2', 'canvas3');
})