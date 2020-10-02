// Synchronize frame
var timeToSync = 0;
function sendFrameSync(match){
  if (isDefined(match) && match.matchStarted){
    var data = {
      type: 'sync',
      frame: match.currentState.frame,
      time: match.currentState.time,
      state: deepcopy(match.currentState),
      inputs: deepcopy(match.previousInputs),
      messageTime: Date.now(),
      matchTime: Date.now() - match.matchStartTime,
      lastReceivedInput: match.lastReceivedInput
    };
    socket.send(data);
  };
};


// Measure latency
function receivePong(match, time){
  if (isDefined(match) && isDefined(match.currentState)){
    match.currentState.serverLatency = Date.now() - time;
  };
};


function syncToOpponent(match, syncData){
  // Confirmed input
  match.lastConfirmedInput = syncData.lastReceivedInput;
  while (isDefined(syncData.lastReceivedInput) && (match.previousInputs.length > 0) && (match.previousInputs[0].i <= syncData.lastReceivedInput.i)){
    match.previousInputs.shift();
  };

  // Time to sync
  match.syncControl++;
  if (isPlayerA(match.currentState, publicKey) && ((match.syncControl % (2*syncFrequency)) == 0)){ // fpsGoal
    var latency = (Date.now() - match.matchStartTime) - syncData.matchTime;
    match.currentState.opponentLatency = latency;
    var expectedFramesAhead = Math.floor(latency * fpsGoal / 1000);
    var opponentsCurrentFrame = syncData.frame + expectedFramesAhead;
    var frameDisparity = match.currentState.frame - opponentsCurrentFrame;
    timeToSync = frameDisparity * 1000 / fpsGoal;
  };
};
