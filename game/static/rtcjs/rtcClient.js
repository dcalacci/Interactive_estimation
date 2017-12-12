const $ = require('jquery')
const _ = require('lodash')
const utils = require('./utils')
const audio = require('./audio')
const io = require('socket.io-client')
const feathers = require('feathers-client')
const face = require('./face')
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

window.$scope = {
  roomName: null,
  roomUsers: [],
  needToCallOtherUsers: true,
  video: null,
  app: app,
  screenSize: 0,
  userBoxMap: {}, // easyrtcid -> box number
  easyRtcIdMap: {}, // easyrtcid -> linkedId
  thisUser: ""
}

var setEasyRtcMapping = function (easyRtcId, linkedId) {
  console.log("updated easyRTC Mapping:", easyRtcId, linkedId)

  // had an issue where the id map would get real big and wobbly if we had to refresh.
  // this should fix it.
  if (_.includes(_.values(window.$scope.easyRtcIdMap), linkedId)) {
    // if we already have the same linked ID
    var oldRtcId = _.invert(window.$scope.easyRtcIdMap)[linkedId]
    var newMap = _.omit(window.$scope.easyRtcIdMap, oldRtcId)
    window.$scope.easyRtcIdMap = newMap
  }
  window.$scope.easyRtcIdMap[easyRtcId] = linkedId
}

// easyRtcId -> linkedId
var getLinkedId = function (easyrtcid) {
  return $scope.easyRtcIdMap[easyrtcid]
}

// linkedId -> easyRtcId
var getEasyRtcId = function (linkedId) {
  return _.invert($scope.easyRtcIdMap)[linkedId]
}

// need to:
// - send linked ID to rhythm server, not easyRTCid.
// - be able to find the DOM id of the video box given a linked ID of a user.
///////////////////////////////////////////////////////////////


// setPeerListener function. Updates this users mapping between easyRtcId and
// linkedId.
var updateLocalEasyRtcMap = function (senderId, msgData) {
  setEasyRtcMapping(senderId, msgData.linkedId)
}


// send this users' linked ID to all other connected users every time
// room occupants change -- this is to keep a link between our own user IDs
// and the easyRTCIds.
var setAndSendLinkedId = function (roomName, selfInfo, linkedId) {
  console.log("sending linked ID:", selfInfo.easyrtcid, linkedId, "to", roomName)
  window.$scope.thisUser = {
    easyrtcid: selfInfo.easyrtcid,
    linkedId: linkedId
  }
  easyrtc.sendDataWS({targetRoom: roomName}, 'linkedId',
                     {easyRtcId: selfInfo.easyrtcid,
                      linkedId: linkedId})
  setEasyRtcMapping(selfInfo.easyrtcid, linkedId)
}

function callEverybodyElse (roomName, userList, selfInfo) {
  setAndSendLinkedId(roomName, selfInfo, linkedId)
  console.log("calling other users, info:", roomName, userList, selfInfo)
  if (window.$scope.needToCallOtherUsers) {
    console.log('need to call other users:', userList)
    _.forEach(userList, (user) => {
      console.log('trying to call user:', user)
      easyrtc.call(
        user.easyrtcid,
        function success (otherCaller, mediaType) {
          setAndSendLinkedId(roomName, selfInfo, linkedId)
          console.log('success', otherCaller, mediaType)
        },
        function failure (errorCode, errorMessage) {
          console.log('failure', errorCode, errorMessage)
        }
      )
    })
    window.$scope.needToCallOtherUsers = false
    screenLogic()
  }
}

function loginSuccess () {
  console.log('Connect to EasyRTC Server')
  $('#videoHolder').css('display', 'none');
  window.$scope.video = document.getElementById('#userBox')
  window.$scope.roomUsers.push({participant: easyrtc.myEasyrtcid, meeting: window.$scope.roomName})
  console.log(window.$scope.roomUsers)
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
      name: window.$scope.thisUser.linkedId,
      participants: window.$scope.roomUsers,
      meeting: window.$scope.roomName,
      meetingUrl: location.href,
      consent: true,
      consentDate: new Date().toISOString()
    })
  }).catch(function (err) {
    console.log('ERROR:', err)
  }).then(function (result) {
    console.log('meeting result:', result)
    audio.startProcessing(window.$scope)
    face.startTracking(window.$scope)
    //face.startFrameTracking(window.$scope)
    window.$scope.updateScores(window.$scope.otherPlayers)
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
  easyrtc.setSocketUrl("https://rhythm-rtc-dev.herokuapp.com")
  //easyrtc.setSocketUrl(":8083")
  easyrtc.dontAddCloseButtons()


  easyrtc.setPeerListener(function (senderId, msgType, msgData, targeting) {
    if (msgType === 'linkedId') {
      updateLocalEasyRtcMap(senderId, msgData)
    }
  })

  easyrtc.setRoomEntryListener(function (entry, roomName) {
    console.log('entered room!')
    window.$scope.needToCallOtherUsers = true
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

  var updateUserBoxMap = function (easyrtcid, slot) {
    console.log("associating box", slot, "with id", easyrtcid)
    window.$scope.userBoxMap[easyrtcid] = slot
  }

  var removeUserBoxMap = function (easyrtcid) {
    window.$scope.userBoxMap = _.omit(window.$scope.userBoxMap, easyrtcid)
  }

  easyrtc.setOnCall(function (easyrtcid, slot) {
    console.log('getConnection count=' + easyrtc.getConnectionCount())
    window.$scope.roomUsers.push({participant: easyrtcid, meeting: window.$scope.roomName})
    updateUserBoxMap(easyrtcid, slot + 1)
    //    console.log($(getIdOfBox(slot + 1) + "_container"))
    $(getIdOfBox(slot + 1) + "_videoHolder").css('display', 'none')
    //$(getIdOfBox(slot + 1) + "_container").css('display', 'unset')
    $(getIdOfBox(slot + 1)).css('display', 'unset')
    screenLogic()
  })

  easyrtc.setOnHangup(function (easyrtcid, slot) {
    setTimeout(function () {
      //updateUserBoxMap(easyrtcid, slot)
      $(getIdOfBox(slot + 1)).css('display', 'none')
      removeUserBoxMap(easyrtcid)
      $(getIdOfBox(slot + 1) + "_videoHolder").css('display', 'block')
      screenLogic()
    }, 20)
  })

  $('#leaveRoomLink').click(function () {
    easyrtc.leaveRoom(groupId, function () {
      console.log("left room:", groupId)
    })
  })
}

function joinRoom () {
  // pull roomName from global groupId, given by django template.
  window.$scope.roomName = groupId
  if (window.$scope.roomName === null || window.$scope.roomName === '' || window.$scope.roomName === 'null') {
    console.log("No group ID / Room name, doing nothing...")
  } else {
    easyrtc.joinRoom(window.$scope.roomName, {}, function (e) { console.log("success"); }, function (e) { console.log('failure'); })
    console.log('entered room: ' + window.$scope.roomName)
//    $('#roomIndicator').html("Currently in room '" + window.$scope.roomName + "'")
  }
}

function screenLogic () {
  // this is the  function that controls the sizing of remote callers on screen
  if (window.$scope.screenSize !== 0) {
    $('.remote').removeClass('m' + window.$scope.screenSize)
  }

  var newSize = 12 / (easyrtc.getConnectionCount())
  $('.remote').addClass('m' + newSize)
  window.$scope.screenSize = newSize
}

module.exports = {
  initClient: init
}
