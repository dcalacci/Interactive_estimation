const $ = require('jquery')
const _ = require('lodash')
const utils = require('./utils')
const audio = require('./audio')
const viz = require('./charts')
const io = require('socket.io-client')
const feathers = require('feathers-client')
// const easyrtc = require('easyrtc')

console.log("connecting to rhythm server:", process.env.SERVER_URL)

var socket = io(process.env.SERVER_URL, {
  'transports': [
    'websocket',
    'flashsocket',
    'htmlfile',
    'xhr-polling',
    'jsonp-polling'
  ]
})

const app = feathers()
.configure(feathers.hooks())
.configure(feathers.socketio(socket))
.configure(feathers.authentication())

var $scope = {
  roomName: null,
  roomUsers: [],
  needToCallOtherUsers: true,
  app: app,
  screenSize: 0
}

function callEverybodyElse (roomName, userList, selfInfo) {
  console.log("calling other users, info:", roomName, userList, selfInfo)
  if ($scope.needToCallOtherUsers) {
    console.log('need to call other users:', userList)
    _.forEach(userList, (user) => {
      console.log('trying to call user:', user)
      easyrtc.call(
        user.easyrtcid,
        function success (otherCaller, mediaType) {
          console.log('success', otherCaller, mediaType)
        },
        function failure (errorCode, errorMessage) {
          console.log('failure', errorCode, errorMessage)
        }
      )
    })
    $scope.needToCallOtherUsers = false
    screenLogic()
  }
}

function loginSuccess () {
  console.log('Connect to EasyRTC Server')
  $('#videoHolder').css('display', 'none');
  $scope.roomUsers.push({participant: easyrtc.myEasyrtcid, meeting: $scope.roomName})
  console.log($scope.roomUsers)
  app.authenticate({
      type: 'local',
      email: process.env.RHYTHM_SERVER_EMAIL,
      password: process.env.RHYTHM_SERVER_PASSWORD
    // email: 'default-user-email',
    // password: 'default-user-password'
  }).then(function (result) {
    console.log('auth result:', result)
    return socket.emit('meetingJoined', {
      participant: easyrtc.myEasyrtcid,
      name: easyrtc.myEasyrtcid,
      participants: $scope.roomUsers,
      meeting: $scope.roomName,
      meetingUrl: location.href,
      consent: true,
      consentDate: new Date().toISOString()
    })
  }).catch(function (err) {
    console.log('ERROR:', err)
  }).then(function (result) {
    console.log('meeting result:', result)
    audio.startProcessing($scope)
    viz.startMM($scope)
  })
}

function loginFailure (errorCode, errorText) {
  console.log("couldn't log into server:", errorCode, errorText);
}

function getIdOfBox (boxNum) {
  return '#box' + boxNum
}

function init () {
  console.log('initializing RTC client...')
  //easyrtc.setSocketUrl("ws://rhythm-rtc-dev.herokuapp.com:80")
  easyrtc.setSocketUrl(":8083")
  easyrtc.dontAddCloseButtons()

  easyrtc.setRoomEntryListener(function (entry, roomName) {
    console.log('entered room!')
    $scope.needToCallOtherUsers = true
  })

  easyrtc.setRoomOccupantListener(callEverybodyElse)

  joinRoom()

  easyrtc.easyApp('rhythm.party',
                  'userBox',
                  ['box1', 'box2', 'box3', 'box4'],
                  loginSuccess,
                  loginFailure)

  easyrtc.setDisconnectListener(function () {
    easyrtc.showError('LOST-CONNECTION', 'Lost connection to signaling server')
  })

  easyrtc.setOnCall(function (easyrtcid, slot) {
    console.log('getConnection count=' + easyrtc.getConnectionCount())
    $scope.roomUsers.push({participant: easyrtcid, meeting: $scope.roomName})
    //    console.log($(getIdOfBox(slot + 1) + "_container"))
    $(getIdOfBox(slot + 1) + "_videoHolder").css('display', 'none')
    //$(getIdOfBox(slot + 1) + "_container").css('display', 'unset')
    $(getIdOfBox(slot + 1)).css('display', 'unset')
    screenLogic()
  })

  easyrtc.setOnHangup(function (easyrtcid, slot) {
    setTimeout(function () {
      $(getIdOfBox(slot + 1)).css('display', 'none')
      $(getIdOfBox(slot + 1) + "_videoHolder").css('display', 'block')
      screenLogic()
    }, 20)
    // need to update viz here and remove participant
  })

  $('#leaveRoomLink').click(function () {
    easyrtc.leaveRoom(groupId, function () {
      console.log("left room:", groupId)
    })
  })
}

function joinRoom () {
  // pull roomName from global groupId, given by django template.
  $scope.roomName = groupId
  if ($scope.roomName === null || $scope.roomName === '' || $scope.roomName === 'null') {
    console.log("No group ID / Room name, doing nothing...")
  } else {
    easyrtc.joinRoom($scope.roomName, {}, function (e) { console.log("success"); }, function (e) { console.log('failure'); })
    console.log('entered room: ' + $scope.roomName)
//    $('#roomIndicator').html("Currently in room '" + $scope.roomName + "'")
  }
}

function screenLogic () {
  // this is the  function that controls the sizing of remote callers on screen
  if ($scope.screenSize !== 0) {
    $('.remote').removeClass('m' + $scope.screenSize)
  }

  var newSize = 12 / (easyrtc.getConnectionCount())
  $('.remote').addClass('m' + newSize)
  $scope.screenSize = newSize
}

module.exports = {
  initClient: init
}
