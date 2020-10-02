// Create lobby and update Lobby state
var currentLobbyId;
var currentLobbyState;


function clearCurrentLobby(){
  delete currentLobbyId;
  delete currentLobbyState;
};

function requestLobbyCreation(){
  console.log('Requesting to create a Lobby');
  socket.emit('lobby-create', '');
};

function receiveLobbyState(lobbyState){
  console.log(currentLobbyId);
  console.log(lobbyState);
  if (lobbyState.id == currentLobbyId){
    setLobbyOptionsDisplay();
    currentLobbyState = lobbyState;

    // Invite link
    document.getElementById("lobby-invite-link-input").value = location.origin + '/?lobby=' + lobbyState.id;

    // Parameters
    document.getElementById("lobby-parameter-name-label").innerText = lobbyState.name;
    document.getElementById('lobby-parameter-rounds-per-match-select').value = lobbyState.parameters['rounds-per-match'];
    document.getElementById('lobby-parameter-win-condition-select').value = lobbyState.parameters['win-condition-type'];
    document.getElementById('lobby-parameter-win-condition-number-select').value = lobbyState.parameters['win-condition-amount'];
    document.getElementById('lobby-parameter-streak-limit-select').value = lobbyState.parameters['streak-limit'];

    // Hide or disable if not owner
    document.getElementById('lobby-start-button').style.display = getDisplayState(Boolean(lobbyState.owner == publicKey));
    document.getElementById('lobby-parameter-edit-name-button').style.display = getDisplayState(Boolean(lobbyState.owner == publicKey));

    // Player Slots
    for (var i = 0; i < lobbyState.players.length; i++){
      var playerData = lobbyState.players[i];
      var slot = i+1;

      document.getElementById("lobby-player-slot-name-label-" + slot).innerText = playerData.name;
      document.getElementById("lobby-add-player-button-" + slot).style.display = 'none';

      document.getElementById("lobby-player-slot-add-friend-button-" + slot).style.display = getDisplayState(Boolean(!isFriend(playerData.id)));
      document.getElementById("lobby-player-slot-remove-button-" + slot).style.display = getDisplayState(Boolean((lobbyState.owner == publicKey) || (playerData.id == publicKey)));
      document.getElementById("leader-crown-" + slot).style.display = getDisplayState(Boolean((lobbyState.owner == playerData.id)));
    };

    var first = true;
    for (var i = i+1; i <= 8; i++){
      if (first){
        document.getElementById("lobby-player-slot-" + i).style.display = 'block';
        document.getElementById("lobby-add-player-button-" + i).style.display = 'block';
      } else {
        document.getElementById("lobby-player-slot-" + i).style.display = 'none';
      };
      first = false;
    };

    // Scoreboard
    document.getElementById("lobby-scoreboard").style.height = (59 + (50 * lobbyState.players.length)) + 'px';
    for (var i = 0; i < lobbyState.players.length; i++){
      var playerData = lobbyState.players[i];
      var slot = i+1;
      document.getElementById("scoreboard-player-panel-" + slot).style.display = 'block';
      document.getElementById("scoreboard-name-label-" + slot).innerText = playerData.name;
      document.getElementById("scoreboard-score-label-" + slot).innerText = lobbyState.score[playerData.id];
    };
    for (var i = i+1; i <= 8; i++){
      document.getElementById("scoreboard-player-panel-" + i).style.display = 'none';
    };
  };
};


document.getElementById('custom-lobby-panel-button').addEventListener('click', function(){
  requestLobbyCreation();
});

document.getElementById('lobby-copy-invite-link-button').addEventListener('click', function(){
  document.getElementById("lobby-invite-link-input").select();
  document.execCommand('copy');
});

document.getElementById('lobby-whatsapp-invite-button').addEventListener('click', function(){
  window.open('https://web.whatsapp.com/send?text=' + document.getElementById("lobby-invite-link-input").value, '_blank');
});

// Manage lobby players
function invitePlayerToLobby(playerId){
  console.log('Lobby invite to ' + playerId + ' sent');
  socket.emit('lobby-invite', playerId);
};

function canShowInvite(){
  return Boolean(!isDefined(liveMatch));
};

unansweredInvites = [];
function receiveInviteToLobby(inviteData){
  console.log('Received invite to lobby');
  console.log(inviteData);

  unansweredInvites.push(inviteData);
  if (canShowInvite()){
    document.getElementById("lobby-accept-menu").style.display = 'block';
    document.getElementById("lobby-accept-button").addEventListener("click", function(){
      acceptInviteToLobby(inviteData['lobby-state'].id);
      document.getElementById("lobby-accept-menu").style.display = 'none';
      unansweredInvites.splice(unansweredInvites.indexOf(inviteData), 1);
    });
    document.getElementById("lobby-refuse-button").addEventListener("click", function(){
      refuseInviteToLobby(inviteData['lobby-state'].id);
      document.getElementById("lobby-accept-menu").style.display = 'none';
      unansweredInvites.splice(unansweredInvites.indexOf(inviteData), 1);
    });
  };
  // inviteData['invited-by']
  // inviteData['lobby-state']
};


function acceptInviteToLobby(id){
  console.log('Lobby invite accepted');
  currentLobbyId = id;
  socket.emit('lobby-accept', id);
};

function refuseInviteToLobby(id){
  console.log('Lobby invite refused');
  socket.emit('lobby-refuse', id);
};

function removeFromLobby(playerId){
  console.log('Removing player ' + playerId + ' from lobby');
  socket.emit('lobby-remove', playerId);
};



var lobbyOptionsMenu = document.getElementById("lobby-options-menu");

var lobbyAddPlayerPanel = document.getElementById("lobby-add-player-panel");
var lobbyAddPlayerButtons = document.getElementsByClassName("lobby-add-player-button");

for (var i = 0; i < lobbyAddPlayerButtons.length; i++){
  lobbyAddPlayerButtons[i].addEventListener("click", function(){
    promptLobbyAddPlayerPanel();
  });
};

function promptLobbyAddPlayerPanel(){
  lobbyAddPlayerPanel.style.display = 'block';
};


function requestAddPlayerToLobby(id){
  lobbyAddPlayerPanel.style.display = 'none';

};


function closeLobbyAddPlayerPanel(){
  lobbyAddPlayerPanel.style.display = 'none';
};


var lobbyAddPlayerInviteButton = document.getElementById('lobby-add-player-invite-button');
var lobbyAddPlayerIdInput = document.getElementById('lobby-add-player-id-input');
lobbyAddPlayerInviteButton.addEventListener("click", function(){
  invitePlayerToLobby(lobbyAddPlayerIdInput.value);
  closeLobbyAddPlayerPanel();
});


document.getElementById('lobby-start-button').addEventListener('click', function(){
  socket.emit('lobby-start', currentLobbyId);
});




document.getElementById("lobby-player-slot-options-button-1").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-1"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-1").addEventListener('click', function(){requestFriendshipBySlot(1)});
document.getElementById("lobby-player-slot-remove-button-1").addEventListener('click', function(){removeFromLobbyBySlot(1)});

document.getElementById("lobby-player-slot-options-button-2").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-2"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-2").addEventListener('click', function(){requestFriendshipBySlot(2)});
document.getElementById("lobby-player-slot-remove-button-2").addEventListener('click', function(){removeFromLobbyBySlot(2)});

document.getElementById("lobby-player-slot-options-button-3").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-3"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-3").addEventListener('click', function(){requestFriendshipBySlot(3)});
document.getElementById("lobby-player-slot-remove-button-3").addEventListener('click', function(){removeFromLobbyBySlot(3)});

document.getElementById("lobby-player-slot-options-button-4").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-4"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-4").addEventListener('click', function(){requestFriendshipBySlot(4)});
document.getElementById("lobby-player-slot-remove-button-4").addEventListener('click', function(){removeFromLobbyBySlot(4)});

document.getElementById("lobby-player-slot-options-button-5").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-5"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-5").addEventListener('click', function(){requestFriendshipBySlot(5)});
document.getElementById("lobby-player-slot-remove-button-5").addEventListener('click', function(){removeFromLobbyBySlot(5)});

document.getElementById("lobby-player-slot-options-button-6").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-6"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-6").addEventListener('click', function(){requestFriendshipBySlot(6)});
document.getElementById("lobby-player-slot-remove-button-6").addEventListener('click', function(){removeFromLobbyBySlot(6)});

document.getElementById("lobby-player-slot-options-button-7").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-7"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-7").addEventListener('click', function(){requestFriendshipBySlot(7)});
document.getElementById("lobby-player-slot-remove-button-7").addEventListener('click', function(){removeFromLobbyBySlot(7)});

document.getElementById("lobby-player-slot-options-button-8").addEventListener('click', function(){toggleElementDisplay(document.getElementById("lobby-player-slot-options-menu-8"), 'inline-block')});
document.getElementById("lobby-player-slot-add-friend-button-8").addEventListener('click', function(){requestFriendshipBySlot(8)});
document.getElementById("lobby-player-slot-remove-button-8").addEventListener('click', function(){removeFromLobbyBySlot(8)});


function requestFriendshipBySlot(slot){
  if (isDefined(currentLobbyState) && ('players' in currentLobbyState) && (currentLobbyState.players.length > (slot-1))){
    requestFriendship(currentLobbyState.players[slot-1].id);
  };
};

function removeFromLobbyBySlot(slot){
  if (isDefined(currentLobbyState) && ('players' in currentLobbyState) && (currentLobbyState.players.length > (slot-1))){
    removeFromLobby(currentLobbyState.players[slot-1].id);
  };
};
