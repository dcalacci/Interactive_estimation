const $ = require('jquery')
const _ = require('lodash')
const utils = require('./utils')
const audio = require('./audio')
const io = require('socket.io-client')
const feathers = require('feathers-client')
const face = require('./face')

console.log('connecting to rhythm server:', process.env.RHYTHM_SERVER_URL)
// global var 'groupId' is given by django
// global var 'linkedId' is given by django

var socket = io(process.env.RHYTHM_SERVER_URL, {
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
  video: null,
  app: app,
  screenSize: 0,
  userBoxMap: { 'box1': '', 'box2': '', 'box3': '', 'box4': ''}, // box number -> rtcid 
  thisUser: {}
}

var webrtc;

var allocSlot = function (peer) {
  var slot
  var sorted_keys = Object.keys(window.$scope.userBoxMap).sort()
  for (var i = 0; i < sorted_keys.length; i++) {
    var key = sorted_keys[i]
    if (window.$scope.userBoxMap[key] === '') {
      slot = key
      break;
    }
  }

  window.$scope.userBoxMap[slot] = peer.id 
  return slot
}

var getSlotByPeer = function(peer) {
  var slot 
  $.each(window.$scope.userBoxMap, function(key, val) {
    // TODO user id or nick?
    // id is rtc id and nick is linkedId
    if (val === peer.id) {
      slot = key
    }
  })

  return slot
}

var freeSlot = function(slot) {
  window.$scope.userBoxMap[slot] = '' 
}


// easyRtcId -> linkedId
var getLinkedId = function (easyrtcid) {
  return $scope.rtcIdMap[easyrtcid]
}

// linkedId -> easyRtcId
var getRtcId = function (linkedId) {
  return _.invert($scope.rtcIdMap)[linkedId]
}

// need to:
// - send linked ID to rhythm server, not easyRTCid.
// - be able to find the DOM id of the video box given a linked ID of a user.
///////////////////////////////////////////////////////////////


// send this users' linked ID to all other connected users every time
// room occupants change -- this is to keep a link between our own user IDs
// and the easyRTCIds.
var setAndSendLinkedId = function (roomName, selfInfo, linkedId) {
  console.log('sending linked ID:', selfInfo.rtcid, linkedId, 'to', roomName)
  window.$scope.thisUser = {
    rtcid: selfInfo.rtcid,
    linkedId: linkedId
  }
}

function loginSuccess () {
  $('#videoHolder').css('display', 'none');
  window.$scope.video = document.getElementById('#userBox')
  window.$scope.thisUser = { rtcId: window.$scope.sessionId, linkedId: linkedId }

  app.authenticate({
      type: 'local',
      email: process.env.RHYTHM_SERVER_EMAIL,
      password: process.env.RHYTHM_SERVER_PASSWORD
  }).then(function (result) {
    console.log('auth result:', result)
    return socket.emit('meetingJoined', {
      participant: window.$scope.thisUser.linkedId,
      // TODO ???
      name: window.$scope.thisUser.linkedId,
      // TODO i think this is wrong
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

function getDomPrefix (slot) {
  return '#' + slot
}

function init () {
  console.log('initializing RTC client...')
  webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold 'our' video
    localVideoEl: 'userBox',
    // set to '' so we can add & style them manually on videoAdded
    remoteVideosEl: '',
    // immediately ask for camera access
    autoRequestMedia: true,
    // TODO populate signalMasterUrl
    url: process.env.SIGNALMASTER_URL,
    // make the user's nick the linkedId so we don't have to keep track of it    
    nick: linkedId
  });

  console.log(process.env.SIGNALMASTER_URL)

  webrtc.on('connectionReady', function(sessionId) {
    window.$scope.sessionId = sessionId
    loginSuccess()
    joinRoom()
  })

  webrtc.on('videoAdded', function (video, peer) { 
    console.log('videoAdded')
    var slot = allocSlot(peer) 
    console.log('slot: ', slot)
    var domPrefix = getDomPrefix(slot)
    $(domPrefix + '_videoPlaceHolder').css('display', 'none')
    var videoContainer = document.getElementById(slot + '_container')
    video.className = 'responsive-video remote'
    videoContainer.appendChild(video)
    console.log('appended video')
    screenLogic()
  })

  webrtc.on('videoRemoved', function (video, peer) { 
    var slot = getSlotByPeer(peer) 
    var domPrefix = getDomPrefix(slot)
    $(domPrefix + '_videoPlaceHolder').css('display', 'block')
    var videoContainer = document.getElementById(slot + '_container')
    var el = document.getElementById(webrtc.getDomId(peer));
    videoContainer.removeChild(el)
    freeSlot(slot)
    screenLogic()
  })

  $('#leaveRoomLink').click(function () {
    webrtc.leaveRoom()
  })
}

function joinRoom () {
  // pull roomName from global groupId, given by django template.
  window.$scope.roomName = groupId
  if (window.$scope.roomName === null || window.$scope.roomName === '' || window.$scope.roomName === 'null') {
    console.log('No group ID / Room name, doing nothing...')
  } else {
    // TODO simplewebrtc join room
    webrtc.on('readyToCall', function () {
      webrtc.joinRoom(window.$scope.roomName);
      console.log('entered room: ' + window.$scope.roomName)
    });
    // $('#roomIndicator').html("Currently in room '" + window.$scope.roomName + "'")
  }
}

function screenLogic () {
  // this is the  function that controls the sizing of remote callers on screen
  // TODO port to simplewebrtc
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
