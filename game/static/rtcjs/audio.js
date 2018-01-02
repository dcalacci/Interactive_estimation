/* global easyrtc*/
const Sibilant = require('sibilant-webaudio')

function processAudio (scope, stream) {
  // console.log('preparing to process audio....')
  // TODO sipleweb
  var speakingEvents = new Sibilant(stream, {passThrough: false})
  speakingEvents.bind('speaking', function () {
    document.querySelector('#userBox').style.border = '5px solid #27ae60'
    // console.log('speaking!')
  })

  speakingEvents.bind('stoppedSpeaking', function (data) {
    scope.app.service('utterances').create(
      {
        // TODO simpleweb
        'participant': scope.thisUser.linkedId,
        'meeting': scope.roomName,
        'startTime': data.start.toISOString(),
        'endTime': data.end.toISOString(),
        'volumes': data.volumes
      }).then(function (res) {
        //// console.log('speaking event recorded!', res)
        var start = new Date(res['startTime'])
        var end = new Date(res['endTime'])
        function pad (n) {
          return String('00' + n).slice(-2)
        }
        var duration = end - start
        //// console.log(end.getHours() + ':' + pad(end.getMinutes()) + ':' + pad(end.getSeconds()) + '- Duration: ' + duration + ' ms')
      }).catch(function (err) {
        console.log('ERROR:', err)
      })
    document.querySelector('#userBox').style.border = '5px solid #555'
  })
}
module.exports = {
  startProcessing: processAudio
}
