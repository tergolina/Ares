var pendingInputs = [];
var inputMap = {
  x: 0,
  y: 0,
  lmb: false,
  rmb: false,
  up: false,
  down: false,
  left: false,
  right: false,
  w: false,
  a: false,
  s: false,
  d: false,
  q: false,
  e: false,
  r: false,
  f: false,
  g: false,
  spacebar: false,
  shift: false,
};

window.onblur = function(){
  for (key in inputMap){
    if (typeof inputMap[key] === 'boolean'){
      inputMap[key] = false;
    };
  };
  sendInput();
};

document.addEventListener('mousedown', event => {
  if (event.button == 0){
    inputMap.lmb = true;
    sendInput();
  } else if (event.button == 2){
    inputMap.rmb = true;
    sendInput();
  };
});

document.addEventListener('mouseup', event => {
  if (event.button == 0){
    inputMap.lmb = false;
    sendInput();
  } else if (event.button == 2){
    inputMap.rmb = false;
    sendInput();
  };
});

document.addEventListener('keydown', event => {
  if (setInputMap(event.keyCode, true)){
    sendInput();
  };
});

document.addEventListener('keyup', event => {
  if (setInputMap(event.keyCode, false)){
    sendInput();
  };
});

var rawMousePosition = {x: 0, y: 0};
document.addEventListener('mousemove', function(e){
  var canvasScale = matchCanvas.clientWidth / matchCanvas.width;
  inputMap.x = Math.round((e.pageX - 2) / canvasScale);
  inputMap.y = Math.round((e.pageY - 2) / canvasScale);
  sendInput();

  rawMousePosition.x = e.pageX;
  rawMousePosition.y = e.pageY;
});


function setInputMap(keyCode, value){
  var strPreviousInputMap = JSON.stringify(inputMap);
  if (keyCode === 16) { // Ctrl
    inputMap.shift = value;
  } else if (keyCode === 32) { // Space
    inputMap.spacebar = value;
  } else if (keyCode === 37) { // Left
    inputMap.left = value;
  } else if (keyCode === 39) { // Right
    inputMap.right = value;
  } else if (keyCode === 38) { // Up
    inputMap.up = value;
  } else if (keyCode === 40) { // Down
    inputMap.down = value;
  } else if (keyCode === 87) { // w
    inputMap.w = value;
  } else if (keyCode === 65) { // a
    inputMap.a = value;
  } else if (keyCode === 83) { // s
    inputMap.s = value;
  } else if (keyCode === 68) { // d
    inputMap.d = value;
  } else if (keyCode === 81) { // q
    inputMap.q = value;
  } else if (keyCode === 69) { // e
    inputMap.e = value;
  } else if (keyCode === 70) { // f
    inputMap.f = value;
  } else if (keyCode === 82) { // r
    inputMap.r = value;
  } else if (keyCode === 71) { // g
    inputMap.g = value;
  };
  return Boolean(strPreviousInputMap != JSON.stringify(inputMap));
};


function saveInputToBuffer(playerState, input){
  playerState.input = input;
  playerState.inputBuffer.push(input);
  if (playerState.inputBuffer.length > inputBufferLength){
    playerState.inputBuffer.shift();
  };
};

function shiftInputBuffer(playerState){
  playerState.inputBuffer.push(playerState.inputBuffer[playerState.inputBuffer.length-1]);
  playerState.inputBuffer.shift();
};

var expectedInputIndex = 0;
var lastReceivedInput;
var lastConfirmedInput;
function isCorrectOrder(match, inputData){
  if (inputData.playerId == publicKey){
    return true;
  } else {
    if (inputData.i == match.expectedInputIndex){
      return true;
    } else {
      return false;
    };
  };
};

async function receiveInput(match, inputData){
  await simulationLock.acquire();
  if (match.matchStarted && isDefined(match.currentState)){ //  && isCorrectOrder(match, inputData)
    inputData.timeWhenReceived = Date.now() - match.matchStartTime;
    inputData.frameWhenReceived = match.currentState.frame;
    match.receivedInputs.push(inputData);

    if (inputData.playerId != publicKey){
      match.lastReceivedInput = inputData;
      match.expectedInputIndex ++;
    };
    var i = match.getStateIndexAtFrame(inputData.frame);
    if (i >= 0){
      if (i < match.matchStates.length){ // Input is for a frame that has already been simulated
        var playerState = getPlayerState(match.matchStates[i], inputData.playerId);

        if (JSON.stringify(playerState.input) != JSON.stringify(inputData.input)){
          saveInputToBuffer(playerState, inputData.input);

          rewind(match, i);
        };

      } else { // Input is for a frame that has yet to come
        match.savePendingInput(inputData);
      };
    } else {
      console.log('Too much desync, input has been ignored.');
    };
  };
  await simulationLock.release();
};

function receiveMultipleInputs(match, inputs){
  for (var i = inputs.length-1; i >= 0; i--){
    if (inputs[i].i <= match.expectedInputIndex){
      if (inputs[i].i == match.expectedInputIndex){
        for (var j = i; j < inputs.length; j++){
          receiveInput(match, inputs[j]);
        };
      };
      break;
    };
  };
};

inputLock = new Lock('Input');

async function sendInput(event){
  await inputLock.acquire();
  if (isDefined(liveMatch) && liveMatch.matchStarted){
    var input = JSON.parse(JSON.stringify(inputMap));
    var inputData = {
      type: 'input',
      input: input,
      frame: liveMatch.currentState.frame,
      time: liveMatch.currentState.time,
      playerId: publicKey,
      i: liveMatch.inputIndex,
    };
    liveMatch.inputIndex ++;

    socket.send(inputData);
    receiveInput(liveMatch, inputData);

    liveMatch.previousInputs.push(inputData);
  };
  await inputLock.release();
};
