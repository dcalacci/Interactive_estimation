//timer
function countdown(counterState, s) {
  var counter = $('#counter');
  var seconds = s || 30;

  function tick() {
    if(counterState == state) {
      seconds--;
      counter[0].innerHTML = "0:" + (seconds < 10 ? "0" : "") + String(seconds);
      if( seconds > 0 ) {
        setTimeout(tick, 1000);
      } else {
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
  var filledBoxes = _.keys(window.$scope.userBoxMap)
  var unFilledBoxes = _.without(allBoxes, filledBoxes)
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
  hideUnusedVideoBoxes()
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
}

////////////////////////



// gets the id of the DOM element ofthe video box for user object `user`
var getVideoBoxId = function (linkedId) {
  var linkedIdMap = _.invert(window.$scope.easyRtcIdMap)
    try {
      var easyRtcId = linkedIdMap[linkedId]
      var boxId = window.$scope.userBoxMap[easyRtcId]
      return "#box" + boxId + "_container"
    } catch(err) {
      console.log("couldnt get easyRtcId mapping:", err)
    }
}

var updateGuess = function (linkedId, guess) {
  var containerId = getVideoBoxId(linkedId)
  var guessDom = $(containerId).children('.info-row').children('.guess')
  console.log("Setting GUESS on element:", guessDom, "from containerId", containerId)
  guessDom.html(`Guess: ${guess}`)
}

// updates the score label for each user in `users`
// players is a list of user objects
var updateGuesses = function (users) {
  console.log("going to update score for users")
  _.each(users, function (user) {
    updateGuess(user.linkedId, user.guess)
  })
}

var updateScore = function (linkedId, score) {
  var containerId = getVideoBoxId(linkedId)
  var scoreDom = $(containerId).children('.info-row').children('.score')
  console.log("Setting SCORE on element:", scoreDom, "from containerId", containerId)
  scoreDom.html(`Score: ${score}`)
}

// updates the score label for each user in `users`
// players is a list of user objects
var updateScores = function (users) {
  console.log("going to update score for users")
  _.each(users, function (user) {
    updateScore(user.linkedId, user.score)
  })
}

function start_interactive(data) {
  console.log("allplayers:", data.allPlayers)
  var otherPlayers = _.filter(data.allPlayers, function (u) {
    return u.linkedId === window.$scope.thisUser.linkedId
  })

  otherPlayers = _.map(otherPlayers, function (u) {
    var userGuess = u.guess < 0 ? '' : u.guess
    return _.extend(u, {guess: userGuess})
  })

  updateScores(otherPlayers)

  // data.all_players

  // // populate list of people you can follow
  // $("#follow_list").html("");
  // $.each(data.all_players, function(i, user) {
  //   var avatar = '/static/' + user.avatar;
  //   new_follow_list(user.username, avatar, user.score);
  // });

  // $("#unfollow_list tbody td").html("");
  // // populate list of people you can unfollow
  // $.each(data.following, function(i, user) {
  //   var avatar = "/static/"+user.avatar;
  //   var row = $($("#unfollow_list tbody td")[i]);
  //   row.html(new_unfollow_list(user.username, avatar, user.score));
  // });

}



$(function () {
  var gameId = "";
  var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
  var ws_path = ws_scheme + '://' + window.location.host + "/multiplayer/lobby/" + groupId;

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
      start_game(data, data.seconds);
      $("#videoContainer").hide();
      resetSlider();

      $(".guess").show();
      $(".outcome").hide();

      if(data.current_round == 0) {
        var audio = new Audio('/static/bell.mp3');
        audio.play();
      }
    }
    else if(data.action == 'ping'){
      console.log(data.text)
    }
    else if(data.action == 'interactive'){
      start_game(data, data.seconds);
      $(".guess").show(); // show guess slider

      // need here to do the equivalent -- "show" interactive guess and score
      // values.
      $(".interactiveGuess").show();
      $(".box#score").html(`${data.score}`);
      $("#videoContainer").show();

      // need to get the box ID from the player linked ID or username
      // then change the content of the dom in the `interactiveGuess` div under that box.

      var otherPlayers = _.filter(data.allPlayers, function (u) {
        return u.linkedId === window.$scope.thisUser.linkedId
      })

      otherPlayers = _.map(otherPlayers, function (u) {
        var userGuess = u.guess < 0 ? '' : u.guess
        return _.extend(u, {guess: userGuess})
      })

      // conditional for scores...
      updateGuesses(otherPlayers)
      updateScores(otherPlayers)

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
      $(".box#score").html(`${data.score}`);

      start_game(data, data.seconds);
      $("#interactiveGuess").hide();
      $(".guess").hide();
      $(".outcome").show();
      if(data.guess != -1) {
        $("#yourGuess").html(data.guess);
      }
      $("#roundAnswer").html(data.correct_answer);

      start_interactive(data);

      playerUsernames = data.allPlayers.map(function (user) { return user.username; })


      allPlayers = data.allPlayers.map(function(user) {
        return user.username;
      });

      // is this allowing people to mimic others' guesses?
      // $(document).on("click", ".plusIcon", function(e) {
      //   var username = e.target.parentElement.parentElement.id;
      //   var avatar = $(`div#${username}>.avatar`).attr('src');
      //   var score = $(`div#${username}>.userScore`).html();

      //   var followingCopy = following.slice();
      //   followingCopy.push(username);
      //   $('[data-toggle="tooltip"]').tooltip('hide');
      //   socket.send(JSON.stringify({
      //     action: 'follow',
      //     following: followingCopy
      //   }));
      // });


      // $(document).on("click", ".unfollow", function(e) {

      //   var username = e.target.id;
      //   var toRemove = following.indexOf(username);
      //   var followingCopy = following.slice();
      //   followingCopy.splice(toRemove, 1);
      //   socket.send(JSON.stringify({
      //     action: 'follow',
      //     following: followingCopy
      //   }));

      // });

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
    socket.send(JSON.stringify({
      action: 'initial',
      guess: guess
    }));
  }
  else if(state == 'interactive'){
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
