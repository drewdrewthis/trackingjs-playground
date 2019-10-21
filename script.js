function startTracker(templateImageData) {
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

  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var canvasRect = canvas.getBoundingClientRect();
  var context = canvas.getContext("2d");
  var templateImageData;
  var capturing = false;
  var videoHeight = 295;
  var videoWidth = 393;

  var tracker = new ObjectTracker();

  tracker.on("track", function (event) {
    if (capturing) {
      return;
    }

    trackingData = event.data;

    // Re-draws template on canvas.
    // context.putImageData(templateImageData, boxLeft, 0);
  });

  var trackerTask = tracking.track(video, tracker, {
    camera: true,
    environment: "user"
  });

  // Waits for the user to accept the camera.
  trackerTask.stop();

  trackerTask.stop();
  tracker.setTemplate(templateImageData.data, width, height);
  trackerTask.run();

  // Sync video ============================================================
  function requestFrame() {
    window.requestAnimationFrame(function () {
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          context.drawImage(video, 0, 0, videoWidth, videoHeight);
        } catch (err) { }
      }

      requestFrame();
    });
  }
  requestFrame();
};

window.addEventListener('load', () => {

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

    startTracker(templateImageData);
  };

  image.crossOrigin = "Anonymous";
  image.src = "assets/ar-card-small.jpg";
})