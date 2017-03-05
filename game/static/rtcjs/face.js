const Thumos = require('thumos')
const jsfeat = require('jsfeat')
// const _ = require('lodash')

/* global clm pModel Stats requestAnimFrame*/
var faceObjects = []
function trackFace (scope) {
  var startTime = new Date()
  var faceEvents = new Thumos('userBox', 'videoOverlay', false, 100)
  faceEvents.bind('faceMoving', function (data) {
    faceObjects.push(
      {
        'x': data.xArray,
        'y': data.yArray,
        'timestamp': data.time
      })
    // send the face objects array every 30 seconds, with ~60*5 objects.
    if ((Date.now() - startTime) > 30 * 1000) {
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
          //console.log("got FACE:", res)
        }).catch(function (err) {
          console.log("couldnt create face thing...", err)
        })
    }
  })
}

function getRgb (scope) {
  var canvas = document.getElementById('videoGrab')
  var context = canvas.getContext('2d')
  context.fillRect(0, 0, canvas.width, canvas.height)

  var data = canvas.toDataURL('image/png')

  context.drawImage(document.getElementById('userBox'), 0, 0, canvas.width, canvas.height)
  var myImageData = context.getImageData(0, 0, canvas.width, canvas.height)
  return myImageData
}

function startFrameTracking (scope) {

  var delta = 5000
  var startTime = new Date()
  var frames = []
  setInterval(function () {
    setTimeout(function () {
      var imageData = getRgb(scope)
      var img_pyr = new jsfeat.pyramid_t(4)
      img_pyr.allocate(imageData.width, imageData.height, jsfeat.U8_t | jsfeat.C1_t)
      img_pyr.data[0] = imageData.data

      jsfeat.imgproc.pyrdown(imageData, img_pyr.data[1], 12, 12)

      var frame = img_pyr.data[1]
      //console.log("downsampled frame data:", frame)
      frames.push({
        height: frame.height,
        width: frame.width,
        data: Array.prototype.slice.call(frame.data),
        timestamp: Date.now()
      })

      //TODO: this fails, I think it's too much data.
      // try to debug why the requests time out, might need to downsample?

      // send the face objects array every 30 seconds, with ~60 objects.
      if ((Date.now() - startTime) > 6 * 1000) {
        //console.log("30 secs passed", Date.now(), startTime)
        var obj = {
          participant: scope.thisUser.linkedId,
          meeting: scope.roomName,
          data: frames,
          timestamp: Date.now()
        }
        //console.log("sending frames...")
        startTime = Date.now()
        scope.app.service('frames').create(obj)
          .then(function (res) {
            //console.log("stored frame:", res)
            frames = []
          }).catch(function (err) {
            console.log("couldnt create FRAME thing...", err)
          })
      }
    }, delta)
  }, delta)
}

module.exports = {
  startTracking: trackFace,
  startFrameTracking: startFrameTracking
}/* global clm pModel Stats requestAnimFrame*/
