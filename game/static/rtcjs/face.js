const Thumos = require('thumos')
// const _ = require('lodash')

/* global clm pModel Stats requestAnimFrame*/
var faceObjects = []
function trackFace (scope) {
  var startTime = new Date()
  var faceEvents = new Thumos('userBox', 'videoOverlay', false)
  faceEvents.bind('faceMoving', function (data) {
    faceObjects.push(
      {
        'x': data.xArray,
        'y': data.yArray,
        'timestamp': data.time
      })
    // send the face objects array every 30 seconds, with ~60 objects.
    if ((Date.now() - startTime) > 30 * 1000) {
      // console.log("30 secs passed", Date.now(), startTime)
      startTime = Date.now()
      scope.app.service('faces').create(
        {
          'participant': scope.user,
          'meeting': scope.roomName,
          'data': faceObjects,
          'timestamp': data.time
        }).then(function (res) {
          faceObjects = []
          //console.log("got it:", res)
        }).catch(function (err) {
          //console.log("couldnt create face thing", err)
        })
    }
  })

  // faceEvents.bind('faceMoving', function (data) {
  //   scope.app.service('faces').create(
  //     {
  //       'participant': scope.user,
  //       'meeting': scope.roomName,
  //       'data': faceObjects,
  //       timestamp: data.time
  //     }).then(function (res) {
  //       //console.log("got it:", res)
  //     }).catch(function (err) {
  //       //console.log("couldnt create face thing", )
  //     })
  // })
}
module.exports = {
  startTracking: trackFace
}/* global clm pModel Stats requestAnimFrame*/
