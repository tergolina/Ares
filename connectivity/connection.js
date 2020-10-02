// Connection to server
var socket;
var urlParams = new URLSearchParams(location.search);


function createWebSocket(){
  // socket = io.connect('http://ec2-18-230-71-207.sa-east-1.compute.amazonaws.com:4000');
  socket = io.connect('http://ec2-35-177-144-99.eu-west-2.compute.amazonaws.com:4000');
  // socket = io.connect('http://localhost:4000');

  // Login
  socket.on('login-success', function(loginData){
    console.log('Logged in');

    if (urlParams.has('challenge') && urlParams.get('challenge') != publicKey){
      requestChallenge(urlParams.get('challenge'));
    } else if (urlParams.has('spectate') && urlParams.get('spectate') != publicKey){
      requestSpectate(urlParams.get('spectate'));
    } else if (urlParams.has('lobby')){
      acceptInviteToLobby(urlParams.get('lobby'));
    } else if (urlParams.has('friend')){
      requestFriendship(urlParams.get('friend'));
      setHomeDisplay();
    } else {
      setHomeDisplay();
    };

    switchToDuelLinkPanel();
  });
  socket.on('login-error', function(errorMessage){
    console.log(errorMessage);
    mainMenu.style.display = 'none';
    document.getElementById("error-panel").style.display = 'block';
    document.getElementById("error-label").innerText = errorMessage;
  });



  // Matchmaking
  socket.on('matchmaking-request', function(){
    setDuelAcceptDisplay();
  });



  // Lobby
  socket.on('lobby-created', function(lobbyState){
    console.log('Lobby created!');
    console.log(lobbyState);
    currentLobbyId = lobbyState.id;
    receiveLobbyState(lobbyState);
  });
  socket.on('lobby-state', function(lobbyState){
    console.log('Lobby state received');
    receiveLobbyState(lobbyState);
  });
  socket.on('lobby-invite', function(inviteData){
    receiveInviteToLobby(inviteData);
  });
  socket.on('lobby-removed', function(lobbyId){
    if (lobbyId == currentLobbyId){
      clearCurrentLobby();
      setHomeDisplay();
    };
  });



  // Challenge
  socket.on('challenge-request', function(key){
    receiveChallengeRequest(key);
  });
  socket.on('challenge-refuse', function(key){
    console.log('Challenge request to ' + key + ' has been refused');
    setHomeDisplay();
  });
  socket.on('challenge-unavailable', function(key){
    console.log('Could not challenge ' + key + ' to a duel');
    setHomeDisplay();
  });
  socket.on('challenge-timeout', function(key){
    console.log('Challenge request to ' + key + ' has timed out');
    setResendChallengeDisplay();
  });



  // Rematch
  socket.on('rematch-request', function(key){
    setRematchDisplay();
    timeoutRematch();
  });
  socket.on('rematch-refuse', function(key){
    console.log('Rematch with ' + key + ' was refused');
    hasRematchBeenAnswered = true;
    setHomeDisplay();
  });



  // Match
  socket.on('start', function(startData){
    console.log('Match started');
    setMatchDisplay();

    liveMatch = new Match();
    liveMatch.setup(startData);

    keepUpdated(liveMatch);
    keepInSync(liveMatch);
  });
  socket.on('input', function(data){
    receiveInput(liveMatch, data);
  });
  socket.on('sync', function(data){
    receiveMultipleInputs(liveMatch, data.inputs);
    syncToOpponent(liveMatch, data);
  });
  socket.on('pong', function(data){
    receivePong(liveMatch, data);
  });

  // Friendship
  socket.on('friendship-accepted', function(playerData){
    addToFriendList(playerData);
  });
  socket.on('friendlist-update', function(updatedFriendData){
    updateFriendList(updatedFriendData);
  });



  // Spectate
  socket.on('spectate-start', function(key){
    startSpectate(key);
  });

  socket.on('spectate-disconnect', function(key){
    endSpectate(key);
  })

  socket.on('spectate-refuse', function(key){
    console.log('Spectate request to ' + key + ' has been refused');
    setSpectateMenuDisplay();
  });

  socket.on('spectate-unavailable', function(key){
    console.log('Unable to spectate ' + key);
    setSpectateMenuDisplay();
  });

  socket.on('spectate-state', function(data){
    receiveSpectateState(data);
  });


  // Send login request
  if ((!hasUserData()) || (isUserIvalidated())){
    createNewUser();
  } else {
    login();
  };
};


createWebSocket();
