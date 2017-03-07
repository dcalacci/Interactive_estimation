const Thumos = require('thumos')
const jsfeat = require('jsfeat')
// const _ = require('lodash')

/* global clm pModel Stats requestAnimFrame*/
var faceObjects = []
function trackFace (scope) {
  var startTime = new Date()
  var faceEvents = new Thumos('userBox', 'videoOverlay', false, 200)
  faceEvents.bind('faceMoving', function (data) {
    faceObjects.push(
      {
        'x': data.xArray,
        'y': data.yArray,
        'timestamp': data.time
      })
    // send the face objects array every 30 seconds, with ~60*5 objects.
    if ((Date.now() - startTime) > 10 * 1000) {
      // console.log("30 secs passed", Date.now(), startTime)
      startTime = Date.now()
      console.log("sending faces:...")
      scope.app.service('faces').create(
        {
          'participant': scope.thisUser.linkedId,
          'meeting': scope.roomName,
          'data': faceObjects,
          'timestamp': Date.now()
        }).then(function (res) {
          faceObjects = []
          console.log("saved face.")
        }).catch(function (err) {
          console.log("couldnt create face thing...", err)
        })
    }
  })
}

function add (a,b) {
  return a + b;
}

function getRgb (scope) {
  var canvas = document.getElementById('videoGrab')
  var context = canvas.getContext('2d')
  context.fillRect(0, 0, canvas.width, canvas.height)

  var data = canvas.toDataURL('image/png')

  context.drawImage(document.getElementById('userBox'), 0, 0, canvas.width, canvas.height)
  var myImageData = context.getImageData(0, 0, canvas.width, canvas.height)

  var img_pyr = new jsfeat.pyramid_t(4)
  //jsfeat.imgproc.grayscale(myImageData.data, img_pyr.data[0].data);
  img_pyr.allocate(myImageData.width, myImageData.height, jsfeat.U8_t | jsfeat.C1_t)
  img_pyr.data[0].data = myImageData.data
  img_pyr.build(img_pyr.data[0], true)

  

  // console.log("new values:", img_pyr.data)
  var frame = Array.prototype.slice.call(img_pyr.data[3])
  jsfeat.imgproc.pyrdown(img_pyr.data[0], img_pyr.data[1])
  jsfeat.imgproc.pyrdown(img_pyr.data[1], img_pyr.data[2])
  jsfeat.imgproc.pyrdown(img_pyr.data[2], img_pyr.data[3])
  // console.log("old values:", myImageData.data.reduce(add, 0))
  // console.log("new values:", img_pyr.data)
  
  return img_pyr.data[3].data
}

function startFrameTracking (scope) {

  var delta = 5000
  var startTime = new Date()
  var frames = []
  setInterval(function () {
    setTimeout(function () {
      var frame = getRgb(scope)
      //console.log("downsampled frame data:", frame)
      frames.push({
        height: frame.height,
        width: frame.width,
        data: frame.data,
        timestamp: Date.now()
      })

      var obj = {
        participant: scope.thisUser.linkedId,
        meeting: scope.roomName,
        data: frames,
        timestamp: Date.now()
      }
      console.log("sending frames...")
      startTime = Date.now()
      scope.app.service('frames').create(obj)
        .then(function (res) {
          console.log("stored frame.")
          frames = []
        }).catch(function (err) {
          console.log("couldnt create FRAME thing...", err)
        })
    }, delta)
  }, delta)
}

module.exports = {
  startTracking: trackFace,
  startFrameTracking: startFrameTracking
}/* global clm pModel Stats requestAnimFrame*/
