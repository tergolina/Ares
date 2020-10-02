var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
var server = app.listen(4000, function(){
  console.log('listening to requests on port 4000')
});

// Static files
app.use(express.static(__dirname));

// Socket setup
var io = socket(server);

var sockets = {};

// Maps of socket ids
var opponentMap = {};
var spectatorMap = {};


// Maps of public keys
var rematchMap = {};
var challengeMap = {};
var lobbyMap = {};


// Data by public key
var lobbies = {};
var players = {};
var matches = {};

// Socket to key and key to socket
var socketIds = {};
var publicKeys = {};


// Utils
function verifyUser(keys){
  return true;
};

function canSpectate(spectatorKey, targetKey){
  return true;
};

function isSpectating(spectatorKey){
  return Boolean(players[spectatorKey].spectating != '');
};

function canInviteToLobby(hostKey, guestKey){
  return Boolean(isInALobby(hostKey) && !(isInALobby(guestKey) && (lobbyMap[guestKey] == lobbyMap[hostKey])))
};

function isInALobby(playerKey){
  return Boolean((playerKey in lobbyMap) && (lobbyMap[playerKey] in lobbies) && (playerKey in players));
};

// Lobby functions
function addPlayerToLobby(lobbyId, playerId){
  var response = false;
  if ((lobbyId in lobbies) && (!lobbies[lobbyId].started) && (lobbies[lobbyId].players.length < lobbies[lobbyId].parameters.size)){
    removePlayerFromLobby(playerId);
    if (playerId in players){
      lobbies[lobbyId].players.push(players[playerId]);
      lobbies[lobbyId].score[playerId] = 0;
      lobbyMap[playerId] = lobbyId;
      response = true;
    };
  };
  return response;
};

function removePlayerFromLobby(playerId){
  if (isInALobby(playerId)){
    var lobbyId = lobbyMap[playerId];
    var lobby = lobbies[lobbyId];
    removeElementFromArray(lobby.queue, players[playerId].id);
    removeElementFromArray(lobby.players, players[playerId]);
    delete lobbyMap[playerId];
    delete lobbies[lobbyId].score[playerId];
    if (lobby.players.length == 0){
      deleteLobby(lobbyId);
    } else {
      if (playerId == lobby.owner){
        lobby.owner = lobby.players[0].id;
      };
      broadcastLobbyState(lobbyId);
    };
    console.log('Removed player ' + playerId + ' from lobby ' + lobbyId);
    console.log(lobbies);
    return true;
  } else {
    return false;
  };
};

function deleteLobby(lobbyId){
  delete lobbies[lobbyId];
};

function broadcastLobbyState(lobbyId){
  if (lobbyId in lobbies){
    for (var i = 0; i < lobbies[lobbyId].players.length; i++){
      send(socketIds[lobbies[lobbyId].players[i].id], 'lobby-state', lobbies[lobbyId]);
    };
  };
};

function updateLobbyScore(lobbyId, report){
  lobbies[lobbyId].matches.push(report);
  lobbies[lobbyId].score[report.winner] += 1;
  broadcastLobbyState(lobbyId);
};

function determineNewLobbyChallenger(lobbyId, report){
  var lobby = lobbies[lobbyId];

  if (report.winner != lobby.challenger){
    var newChallenger = lobby.queue.pop();
    lobby.queue.push(lobby.challenger);
    lobby.challenger = newChallenger;
  };
};


// Spectate functions
function broadcastToSpectators(id, type, data){
  if (id in spectatorMap){
    for (var i = 0; i < spectatorMap[id].length; i++){
      send(spectatorMap[id][i], type, data);
    };
  };
};

function startSpectate(spectatorKey, targetKey){
  if (!(socketIds[targetKey] in spectatorMap)){
    spectatorMap[socketIds[targetKey]] = [];
  };
  spectatorMap[socketIds[targetKey]].push(socketIds[spectatorKey]);
  players[spectatorKey].spectating = targetKey;
  send(socketIds[spectatorKey], 'spectate-start', targetKey);
};

function stopSpectate(spectatorKey, targetKey){
  if (isSpectating(spectatorKey)){
    removeElementFromArray(players[spectatorKey].spectating, spectatorKey);
    players[spectatorKey].spectating = '';
  };
};

// Match functions
function createNextLobbyMatch(lobbyId){
  console.log('Creating next lobby match');
  console.log(lobbies[lobbyId]);
  var lobby = lobbies[lobbyId];

  var aID = lobby.challenger;

  if (lobby.queue.length == 0){ // Initialize lobby queue
    for (var i = 0; i < lobby.players.length; i++){
      if (lobby.players[i].id != aID){
        lobby.queue.push(lobby.players[i].id);
      };
    };
  };

  var bID = lobby.queue[0];

  lobby.queue.push(lobby.queue[0]);
  lobby.queue.shift();

  for (var i = 0; i < lobby.players.length; i++){
    if ((lobby.players[i].id != aID) && (lobby.players[i].id != bID)){
      startSpectate(lobby.players[i].id, aID);
    } else {
      stopSpectate(lobby.players[i].id);
    };
  };

  return createMatch({'aID': aID, 'bID': bID, 'rounds': lobby.parameters['rounds-per-match'], 'source-type': 'lobby', 'source-id': lobbyId});
};

function createMatch(matchData){
  matchData.id = 'm_' + randomId();
  matchData['status'] = 'unfinished';
  matches[matchData.id] = matchData;
  opponentMap[socketIds[matchData.aID]] = socketIds[matchData.bID];
  opponentMap[socketIds[matchData.bID]] = socketIds[matchData.aID];
  return matchData.id;
};

function deleteMatch(matchId){
  if (matchId in matches){
    delete opponentMap[socketIds[matches[matchId].aID]];
    delete opponentMap[socketIds[matches[matchId].bID]];
    delete matches[matchId];
  };
};

function closeMatch(socket){
  delete opponentMap[opponentMap[socket.id]];
  delete opponentMap[socket.id];
};


function startMatch(matchId){
  if (matchId in matches){
    console.log('Starting match ' + matchId);
    matches[matchId].time = Date.now();
    console.log(matches[matchId]);

    send(socketIds[matches[matchId].aID], 'start', matches[matchId]);
    send(socketIds[matches[matchId].bID], 'start', matches[matchId]);
  };
};



function setupServerWebSocket(socket){
  // Matchmaking
  socket.on('matchmaking-request', function(){
    console.log('Player ' + publicKeys[socket.id] + ' requested matchmaking');
    matchmakingQueue.push(publicKeys[socket.id]);
    tryToMatch();
  });


  // Duel
  socket.on('challenge-request', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' wants to challenge ' + key + ' to a duel');
    if ((key in socketIds) && (socketIds[key] in sockets) && !(socketIds[key] in opponentMap)){
      challengeMap[publicKeys[socket.id]] = key;
      send(socketIds[key], 'challenge-request', publicKeys[socket.id]);
    } else {
      send(socket.id, 'challenge-unavailable', key);
    };
  });
  socket.on('challenge-accept', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' accepted ' + key + ' challenge to a duel');
    if ((key in challengeMap) && (challengeMap[key] == publicKeys[socket.id])){
      delete challengeMap[key];
      var matchId = createMatch({'aID': publicKeys[socket.id], 'bID': key, 'rounds': 3, 'source-type': 'duel', 'source-id': key});
      startMatch(matchId);
    } else {
      send(socket.id, 'challenge-refuse', key);
    };
  });
  socket.on('challenge-refuse', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' refused ' + key + ' challenge to a duel');
    if ((key in challengeMap) && (challengeMap[key] == publicKeys[socket.id])){
      send(socketIds[key], 'challenge-refuse', publicKeys[socket.id]);
    };
  });
  socket.on('challenge-timeout', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' timed out ' + key + ' challenge to a duel');
    if ((key in challengeMap) && (challengeMap[key] == publicKeys[socket.id])){
      send(socketIds[key], 'challenge-timeout', publicKeys[socket.id]);
    };
  });


  // Rematch
  socket.on('rematch-accept', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' accepted rematch');
    if ((publicKeys[socket.id] in rematchMap) && (rematchMap[publicKeys[socket.id]] in rematchMap)){
      delete rematchMap[publicKeys[socket.id]];
      console.log('Rematch partially accepted by ' + publicKeys[socket.id]);
    } else if ((publicKeys[socket.id] in rematchMap) && !(rematchMap[publicKeys[socket.id]] in rematchMap)){
      console.log('Rematch confirmed by ' + publicKeys[socket.id]);
      delete rematchMap[publicKeys[socket.id]];
      var matchId = createMatch({'aID': rematchMap[publicKeys[socket.id]], 'bID': publicKeys[socket.id], 'rounds': 3, 'source-type': 'duel', 'source-id': rematchMap[publicKeys[socket.id]]});
      startMatch(matchId);
    };
  });
  socket.on('rematch-refuse', function(key){
    console.log('Rematch refused by ' + publicKeys[socket.id]);
    send(socketIds[rematchMap[publicKeys[socket.id]]], 'rematch-refuse', key);
    delete rematchMap[rematchMap[publicKeys[socket.id]]];
    delete rematchMap[publicKeys[socket.id]];
  });



  // Lobby
  socket.on('lobby-create', function(){
    if ((socket.id in publicKeys) && (!isInALobby(publicKeys[socket.id]))){
      var lobbyId = 'l_' + randomId();
      console.log('Creating lobby ' + lobbyId + ' for player ' + publicKeys[socket.id]);
      lobbies[lobbyId] = {'id': lobbyId,
                          'name': players[publicKeys[socket.id]].name + "'s Lobby",
                          'owner': publicKeys[socket.id],
                          'parameters': {'rounds-per-match': '3',
                                         'win-condition-type': 'score',
                                         'win-condition-amount': '8',
                                         'streak-limit': 'roundtrip',
                                         'size': 8},
                          'players': [],
                          'challenger': publicKeys[socket.id],
                          'queue': [],
                          'matches': [],
                          'score': {},
                          'started': false,
                        };
      addPlayerToLobby(lobbyId, publicKeys[socket.id]);
      send(socket.id, 'lobby-created', lobbies[lobbyId]);
    };
  });
  socket.on('lobby-invite', function(playerKey){
    if ((socket.id in publicKeys) && canInviteToLobby(publicKeys[socket.id], playerKey)){
      console.log('Lobby invite sent to ' + playerKey);
      send(socketIds[playerKey], 'lobby-invite', {'type': 'lobby', 'invited-by': players[publicKeys[socket.id]], 'lobby-state': lobbies[lobbyMap[publicKeys[socket.id]]]});
    };
  });
  socket.on('lobby-accept', function(lobbyId){
    if (addPlayerToLobby(lobbyId, publicKeys[socket.id])){
      broadcastLobbyState(lobbyId);
    };
  });
  socket.on('lobby-refuse', function(lobbyId){

  });
  socket.on('lobby-remove', function(playerId){
    if ((socket.id in publicKeys) && (playerId in lobbyMap) && (lobbyMap[playerId] in lobbies) && ((lobbies[lobbyMap[playerId]].owner == publicKeys[socket.id]) || (publicKeys[socket.id] == playerId))){
      var lobbyId = lobbyMap[playerId];
      if (removePlayerFromLobby(playerId)){
        broadcastLobbyState(lobbyId);
        send(socketIds[playerId], 'lobby-removed', lobbyId);
      };
    };
  });
  socket.on('lobby-update', function(lobbyState){

  });
  socket.on('lobby-start', function(lobbyId){
    if ((lobbyId in lobbies) && (lobbies[lobbyId].owner == publicKeys[socket.id]) && (!lobbies[lobbyId].started)){
      lobbies[lobbyId].started = true;
      var matchId = createNextLobbyMatch(lobbyId);
      startMatch(matchId);
    };
  });


  // Friendship
  socket.on('friendship-request', function(playerId){
    if (playerId in players){
      send(socket.id, 'friendship-accepted', players[playerId]);
    } else {
      send(socket.id, 'friendship-error', 'The player you are requesting is not currently online');
    };
  });
  socket.on('friendlist-update', function(friendList){
    if ((socket.id in publicKeys) && (publicKeys[socket.id] == playerId)){
      var updatedFriendData = {};
      for (var i = 0; i < friendList.length; i++){
        if (friendList[i].id in players){
          updatedFriendData[friendList[i].id] = players[friendList[i].id];
        };
      };
      send(socket.id, 'friendlist-update', updatedFriendData);
    };
  });


  // Spectate
  socket.on('spectate-request', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' wants to spectate ' + key);
    if ((key in socketIds) && (socketIds[key] in sockets)){
      if (canSpectate(publicKeys[socket.id], key)){
        startSpectate(publicKeys[socket.id], key);
      } else {
        send(socket.id, 'spectate-refuse', key);
      };
    } else {
      send(socket.id, 'spectate-unavailable', key);
    };
  });
  socket.on('spectate-end', function(key){
    console.log('Player ' + publicKeys[socket.id] + ' stopped spectating');
    stopSpectate(publicKeys[socket.id]);
  });



  // Match
  socket.on('message', function(data){
    data.serverTime = Date.now();
    data.from = publicKeys[socket.id];
    send(opponentMap[socket.id], data.type, data);

    if (data.type == 'sync'){
      send(socket.id, 'pong', data.messageTime);

      broadcastToSpectators(socket.id, 'spectate-state', data);
    };
  });
  socket.on('match-end', function(report){
    console.log('Match ' + report.id + ' ended');
    if (report.id in matches){
      var match = matches[report.id];
      if (match['status'] == 'partial'){
        match['status'] = 'finished';

        var lobbyId = match['source-id'];
        if ((match['source-type'] == 'lobby') && (lobbyId in lobbies)){
          updateLobbyScore(lobbyId, report);
          determineNewLobbyChallenger(lobbyId, report);
          var matchId = createNextLobbyMatch(lobbyId);
          startMatch(matchId);

        } else {
          rematchMap[match.aID] = match.bID;
          rematchMap[match.bID] = match.aID;
          send(socketIds[match.aID], 'rematch-request', socketIds[match.bID]);
          send(socketIds[match.bID], 'rematch-request', socketIds[match.aID]);
        };

        deleteMatch(report.id);

      } else {
        matches[report.id]['status'] = 'partial';
      };
    };
  });
};


io.on('connection', function(socket){
  sockets[socket.id] = socket;

  console.log('Client socket connected as ' + socket.id);

  socket.on('login-request', function(data){
    if (verifyUser(data)){
      if ((data.publicKey in socketIds) && (socketIds[data.publicKey] in opponentMap)){
        console.log('User already logged in. Socket: ' + socketIds[data.publicKey] + ' | PublicKey: ' + data.publicKey);
        send(socket.id, 'login-error', 'This user is currently in a match');

      } else {
        console.log('User logged in. Socket: ' + socket.id + ' | PublicKey: ' + data.publicKey);

        publicKeys[socket.id] = data.publicKey;

        if (data.publicKey in socketIds){
          send(socketIds[data.publicKey], 'login-error', 'User switched to another tab');
          delete publicKeys[socketIds[data.publicKey]];

        } else {
          players[data.publicKey] = {'id': data.publicKey, 'name': data.name, 'spectating': ''};
        };

        socketIds[data.publicKey] = socket.id;

        setupServerWebSocket(socket);
        send(socket.id, 'login-success', {});

      };
    } else {
      console.log('User failed to login. Socket: ' + socket.id + ' | PublicKey: ' + data.publicKey);
      send(socket.id, 'login-error', 'Authentication failed');
    };
  });

  socket.on('disconnect', function(){
    console.log('Player ' + publicKeys[socket.id] + ' disconnected');

    // Handle spectate
    broadcastToSpectators(socket.id, 'spectate-disconnect', publicKeys[socket.id]);

    // Handle lobby
    removePlayerFromLobby(publicKeys[socket.id]);

    delete players[publicKeys[socket.id]];
    delete socketIds[publicKeys[socket.id]];
    delete publicKeys[socket.id];

    if (socket.id in opponentMap){
      send(opponentMap[socket.id], 'quit', Date.now());
      closeMatch(socket);
    };

    delete sockets[socket.id];
  });
});


function send(id, label, message){
  if (id in sockets){
    sockets[id].emit(label, message);
    if (label.startsWith('login') || label.startsWith('friend') || label.startsWith('lobby') || ((label.startsWith('challenge') || label.startsWith('spectate') || (id in opponentMap)) && (id in publicKeys))){
    };
  };
};


// Utils
function randomId(n=32){
  var baseStr = '';
  for (var i = 0; i < n; i++){
    baseStr += 'x';
  };
  return baseStr.replace(/[xy]/g, function(c){
    var r = Math.random() * 36 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(36);
  });
};

function removeElementFromArray(array, elem) {
  var index = array.indexOf(elem);
  if (index > -1) {
    array.splice(index, 1);
  };
};


// Matchmaking
var matchmakingQueue = [];
var matchmakingWait = {};
var matchmakingAccept = {};
var matchmakingLock = false;

function tryToMatch(){
  if (!matchmakingLock){
    matchmakingLock = true;

    while (matchmakingQueue.length > 1){
      matchmakingWait[matchmakingQueue[0]] = matchmakingQueue[1];
      matchmakingWait[matchmakingQueue[1]] = matchmakingQueue[0];

      send(socketIds[matchmakingQueue[0]], 'matchmaking-request');
      send(socketIds[matchmakingQueue[1]], 'matchmaking-request');

      matchmakingQueue.shift();
      matchmakingQueue.shift();
    };

    matchmakingLock = false;
  };
};
