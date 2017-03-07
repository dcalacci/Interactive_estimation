//timer
if (typeof(window.$scope) === 'undefined') {
  window.$scope = {}
}

function countdown(counterState, s) {
  var counter = $('#counter');
  console.log("given seconds:", s)
  var seconds = s || 30;

  console.log("state:", counterState)

  var formatTime = function (secs) {
    var sec_num = parseInt(secs, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
  }

  function tick() {
    console.log("state:", counterState)
    if(counterState == state) {
      seconds--;
      if (seconds > 0 && seconds < 16 && state === 'interactive') {
        counter[0].innerHTML = "0:" + (seconds < 10 ? "0" : "") + String(seconds);
        hideVideo();
        $('#post-interactive-instructions').show()
        setTimeout(tick, 1000);
      } else if ( seconds > 0 && state === "interactive") {
        // weird dumb hack to make it count down to 0 for discussion
        // and then give 15 seconds to individual guessing choice.
        var textSeconds = seconds - 15
        counter[0].innerHTML = formatTime(textSeconds)
        //counter[0].innerHTML = "0:" + (textSeconds < 10 ? "0" : "") + String(textSeconds);
        $('#interactive-instructions').show()
        setTimeout(tick, 1000);
      } else if (seconds > 0) {
        counter[0].innerHTML = formatTime(seconds)
        //counter[0].innerHTML = "0:" + (seconds < 10 ? "0" : "") + String(seconds);
        setTimeout(tick, 1000);
      } else {
        $('#interactive-instructions').hide()
        $('#post-interactive-instructions').hide()
        var submit = $("#submit")[0];
        submit.click();
      }
    }
  }
  tick();
}


//slider
$("#slider").slider({
  min: 0,
  max: 1,
  step: 0.01,
  slide: function(event, ui) {
    $('#correlation')[0].innerHTML = ui.value;
    socket.send(JSON.stringify({
      'action': 'slider',
      "sliderValue": ui.value
    }));
    console.log("slider state:", state)
    var action = state == 'interactive' ? 'interactive' : 'initial'
    socket.send(JSON.stringify({
      action: action,
      guess: ui.value
    }));
  },
  change: function(event, ui) {
    $('.ui-slider-handle').show();
    $('#guess').val(ui.value);
  }
});

//breadcrumbs
function set_breadcrumbs(state, round) {
  $("#breadcrumbs").show();
  var breadcrumbs = $("#breadcrumbs > ul").children();
  $.each(breadcrumbs, function(i, item) {
    $(item).removeClass("active");
  })
  $("#"+state).addClass("active");
  $("#currentRound").html(round);
}

function resetSlider() {
  $('.ui-slider-handle').hide();
  $('#guess').val(-1);
  $('#correlation')[0].innerHTML = '';
}

function getUnusedVideoBoxes() {
  var allBoxes = [1, 2, 3, 4]
  var filledBoxes = _.values(window.$scope.userBoxMap)
  console.log('filled boxes:', filledBoxes)
  var unFilledBoxes = _.filter(allBoxes, function (n) { return _.indexOf(filledBoxes, n) < 0})
  console.log("unfilled boxes:", unFilledBoxes)
  return unFilledBoxes
}

function hideUnusedVideoBoxes() {
  var unfilledBoxes = getUnusedVideoBoxes()
  _.each(unfilledBoxes, function (boxNumber) {
    $("#box" + boxNumber + "_videoHolder").hide()
  })
}

function start_game(data, seconds) {
  state = data.action;

  $("#myModal").modal('hide');
  $("#lobby").hide();
  $("#lobbyInfo").hide();
  $("#startButtonRow").hide();
  set_breadcrumbs(state, data.current_round);
  $("#game").show();

  $("img.img-responsive").attr("src", '/static/plots/' + data.plot);
  countdown(state, seconds);
  $("#remaining").html(data.remaining);

  var audio = new Audio('/static/round-sound.mp3');
  audio.play();
  hideUnusedVideoBoxes()
}

////////////////////////



// gets the id of the DOM element ofthe video box for user object `user`
var getVideoBoxId = function (linkedId) {
  var linkedIdMap = _.invert(window.$scope.easyRtcIdMap)
    try {
      var easyRtcId = linkedIdMap[linkedId]
      console.log("linked id:", linkedId, "easyrtcid:", easyRtcId, "userboxmap:", window.$scope.userBoxMap)
      var boxId = window.$scope.userBoxMap[easyRtcId]
      return "#box" + boxId + "_container"
    } catch(err) {
      console.log("couldnt get easyRtcId mapping:", err)
    }
}

// DISABLED for this experiment (1/30/17)
var updateGuess = function (linkedId, guess) {
  var containerId = getVideoBoxId(linkedId)
  // var guessDom = $(containerId).children('.card').children('.card-block').children('.info-row').children('.guess')
  // //console.log("Setting GUESS on element:", guessDom, "from containerId", containerId)
  // if (typeof guess === 'undefined') {
  //   guessDom.html(`<span class="badge badge-pill badge-warning">guess: ...</span>`)
  // } else {
  //   guessDom.html(`<span class="badge badge-pill badge-warning">guess: ${guess}</span>`)
  // }
}

// updates the score label for each user in `users`
// players is a list of user objects
var updateGuesses = function (users) {
  console.log("going to update guesses for users")
  _.each(users, function (user) {
    updateGuess(user.linkedId, user.guess)
  })
}

var updateScore = function (linkedId, score) {
  console.log("I should be able to update a score:", linkedId, score)
  var containerId = getVideoBoxId(linkedId)
  var scoreDom = $(containerId).children('.card').children('.card-block').children('.info-row').children('.score')
  console.log("Setting SCORE on element:", scoreDom, "container:", containerId, window.$scope.userBoxMap)
  if (typeof score === 'undefined') {
    scoreDom.html(`<span class="badge badge-pill badge-warning">score: ...</span>`)
  } else {
    console.log("setting score to...", score)
    scoreDom.html(`<span class="badge badge-pill badge-info">score: ${score} </span>`)
  }
}

// updates the score label for each user in `users`
// players is a list of user objects
var updateScores = function (users) {
  console.log("going to update score for users", users)
  _.each(users, function (user) {
    updateScore(user.linkedId, user.score)
  })
}



function start_interactive(data) {
  console.log("allplayers:", data.allPlayers)
  window.$scope.otherPlayers = _.filter(data.allPlayers, function (u) {
    return u.linkedId !== window.$scope.thisUser.linkedId
  })

  window.$scope.otherPlayers = _.map(window.$scope.otherPlayers, function (u) {
    var userGuess = u.guess < 0 ? '' : u.guess
    return _.extend(u, {guess: userGuess})
  })

  updateScores(window.$scope.otherPlayers)
}

var hideVideo = function () {
  console.log("hiding video...")
  $("#videoContainer").hide();
  $('.responsive-video').each(function(i, e) {
    e.muted = true
  });
}

var showVideo = function () {
  $("#videoContainer").show();
  $('.responsive-video').each(function(i, e) {
    e.muted = false
  });
}


$(function () {
  var gameId = "";
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + "/multiplayer/lobby/" + groupId;

  window.$scope.updateScores = updateScores

  // console.log("Connecting to " + ws_path);
  socket = new ReconnectingWebSocket(ws_path);

  if (!socket){
    console.log('Socket is null');
    alert("Your browser doesn't support Websocket");
  }

  // Helpful debugging
  socket.onopen = function () {
    console.log("Connected to chat socket");
  };

  socket.onclose = function () {
    console.log("Disconnected from chat socket");
  };

  $(document).on("click", "#startButton", function(e) {
    socket.send(JSON.stringify({
      action: 'start_interactive',
      gameId: gameId
    }));
  });

  socket.onmessage = function (msg) {
    // console.log(msg.data);
    var data = JSON.parse(msg.data);
    console.log("RECEIVED MESSAGE:", data)
    if(data.error){
      console.log(data.msg);
      return;
    }

    if(data.action == "info"){
      document.querySelector('#connected_players').innerHTML = data.connected_players || 0;
      gameId = data.game_id;
      //document.querySelector('#total_players').innerHTML = data.total_players || 0;
    }
    else if(data.action == "redirect"){
      var proto = (ws_scheme == "wss") ? "https://" : "http://";
      window.location.href = proto + window.location.host + data.url;
    }
    else if(data.action == 'avatar'){
      $('.user-avatar').attr('src', data.url);
    }
    else if(data.action == 'initial'){
      console.log("START OF INITIAL ROUND")
      start_game(data, data.seconds);
      hideVideo();
      resetSlider();

      $("#slider-row").show();
      $("#outcome-row").hide();

      if(data.current_round == 0) {
        var audio = new Audio('/static/bell.mp3');
        audio.play();
      }
    }
    else if(data.action == 'ping'){
      console.log(data.text)
    }
    else if(data.action == 'interactive'){
      console.log("START OF INTERACTIVE ROUND")
      start_game(data, data.seconds);
      $("#slider-row").show();
      $('#submit').hide();

      // need here to do the equivalent -- "show" interactive guess and score
      // values.
      //$(".interactiveGuess").show();
      $("#score-result").html(`${data.score}`);
      $("#group-score-result").html(`${data.groupScore}`);
      showVideo();

      // need to get the box ID from the player linked ID or username
      // then change the content of the dom in the `interactiveGuess` div under that box.

      window.$scope.otherPlayers = _.filter(data.allPlayers, function (u) {
        return u.linkedId !== window.$scope.thisUser.linkedId
      })

      window.$scope.otherPlayers = _.map(window.$scope.otherPlayers, function (u) {
        var userGuess = u.guess < 0 ? '' : u.guess
        return _.extend(u, {guess: userGuess})
      })

      // conditional for scores...
      updateGuesses(window.$scope.otherPlayers)
      updateScores(window.$scope.otherPlayers)

      // // data.following = [{"username":"Test", "avatar":"cow.png", "score": 1.0}]
      // $("#following_list tbody").html("");
      // $.each(data.following, function(i, user) {
      //   if (user.guess < 0) {
      //     user.guess = '';
      //   }
      //   var avatar = "/static/"+user.avatar;
      //   $("#following_list tbody").append(`
      //     <tr>
      //       <td id=${user.username}>
      //         <img src=${avatar} class='avatar' />
      //         <span>guess: ${user.guess}</span>
      //       </td>
      //     </tr>
      //   `);
      // })
    }
    else if(data.action == 'outcome'){
      $('#submit').show();
      $("#score-result").html(`${data.score}`);
      $("#group-score-result").html(`${data.groupScore}`);

      start_game(data, data.seconds);
      //$("#interactiveGuess").hide();
      $("#slider-row").hide();
      $("#outcome-row").show();
      if(data.guess != -1) {
        $("#yourGuess").html(data.guess);
      }
      $("#roundAnswer").html(data.correct_answer);

      console.log("allplayers:", data.allPlayers)
      start_interactive(data);

      playerUsernames = data.allPlayers.map(function (user) { return user.username; })


      allPlayers = data.allPlayers.map(function(user) {
        return user.username;
      });
    }

    else if(data.action == 'sliderChange'){
      updateGuess(data.linkedId, data.slider)
      // this (maybe?) updates also for our user; we should fix that.
      // var vBoxId = getVideoBoxId(data.linkedId)
      // console.log("going to update score for user ", data.linkedId, "on boxId", vBoxId)
      // $(`#${data.username} > span`).html(data.slider);
    }

    else if(data.action == 'followNotify'){
      following = data.following.map(function(user) {
        return user.username;
      });
      start_interactive(data);
    }
    else{
      console.log(data)
    }
  };
});

$('input#submit').click(function () {
  $("#myModal").modal('show');

  if (state == 'initial') {
    var guess = $('#guess').val();
    console.log("sending guess (initial):", guess)
    socket.send(JSON.stringify({
      action: 'initial',
      guess: guess
    }));
  }
  else if(state == 'interactive'){
    copnsole.log("sending guess (interactive):", guess)
    var guess = $('#guess').val();
    socket.send(JSON.stringify({
      action: 'interactive',
      socialGuess: guess
    }));
  }
  else if(state == 'outcome'){
    socket.send(JSON.stringify({
      action: 'outcome'
    }));
  }
  else {
     console.log(state)
 }
});
