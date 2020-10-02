var replayStates = [];
var replayInputs = [];
var replayIndex = 0;
var replayState;

var paused = true;
var replaySpeed;

function verifyIntegrity(){
  console.log('verifying input integrity...');
  var lastIndexById = {};
  var id;
  for (var i = 0; i < replayInputs.length; i++){
    id = replayInputs[i].playerId;
    if (id in lastIndexById){
      if (lastIndexById[id] + 1 != replayInputs[i].i){
        console.log('INPUT MISSING ' + lastIndexById[id] + ' for player ' + id);
      };
    };
    lastIndexById[id] = replayInputs[i].i;
  };
};


function setupReplay(strReplayData){
  var replayData = JSON.parse(strReplayData);
  replayStates = replayData.states;
  replayInputs = replayData.inputs;

  replayIndex = 0;
  replayState = replayStates[replayIndex];

  paused = true;
  replaySpeed = replaySpeedSelect.value;

  verifyIntegrity();

  setReplayDisplay();
  replayDraw();

  replay();

  replayPlayPauseButton.addEventListener('click', function(){
    if (paused){
      replayPlayPauseButton.innerHTML = 'II';
      resumeReplay();
    } else {
      pauseReplay();
    };
  });

  document.getElementById('advance-frame-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    advanceFrames();
    replayDraw();
  });

  document.getElementById('advance-index-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    advanceIndex();
    replayDraw();
  });

  document.getElementById('rollback-frame-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    rollbackFrames();
    replayDraw();
  });

  document.getElementById('rollback-index-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    rollbackIndex();
    replayDraw();
  });

  document.getElementById('reset-replay-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    resetReplay();
    replayDraw();
  });

  document.getElementById('rollback-10-frames-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    rollbackFrames(n=10);
    replayDraw();
  });

  document.getElementById('advance-10-frames-button').addEventListener('click', function(){
    if (!paused){
      pauseReplay();
    };
    advanceFrames(n=10);
    replayDraw();
  });

  replaySpeedSelect.addEventListener('change', function(){
    replaySpeed = replaySpeedSelect.value;
  });
};


function resumeReplay(){
  paused = false;
};

function pauseReplay(){
  replayPlayPauseButton.innerHTML = '>'
  paused = true;
};


function replayAtEnd(){
  return Boolean(replayIndex == replayStates.length - 1);
};

function replayAtStart(){
  return Boolean(replayIndex == 0);
};


function resetReplay(){
  replayIndex = 0;
  replayState = replayStates[replayIndex];
};

function rollbackIndex(){
  if (!replayAtStart()){
    replayIndex --;
    replayState = replayStates[replayIndex];
  };
};

function rollbackFrames(n=1){
  var targetFrame = replayState.frame - n;
  while (replayState.frame > targetFrame && !replayAtStart()){
    rollbackIndex();
  };
};

function advanceIndex(){
  if (!replayAtEnd()){
    replayIndex ++;
    replayState = replayStates[replayIndex];
  };
};

function advanceFrames(n=1){
  var targetFrame = replayState.frame + n;
  while (replayState.frame < targetFrame && !replayAtEnd()){
    advanceIndex();
  };
};

var lastFrameTime = 0;
async function replay(){
  while (true){
    if (!paused && !replayAtEnd()){

      var time = Date.now();
      advanceIndex();
      var elapsed = Date.now() - time;

      await sleep(((replayState.time - lastFrameTime) / replaySpeed) - elapsed);
      lastFrameTime = replayState.time;

      replayDraw();
    } else {
      await sleep(100);
    };
  };
};



function getPlayerColor(id){
  if (id == replayState.playerA.id){
    return 'green';
  } else {
    return 'red';
  };
};

function showLastInputs(n=15){
  replayInputDisplay.innerHTML = '';
  var j = n;
  for (var i = replayInputs.length - 1; i >= 0; i--){
    if (replayInputs[i].receivedMatchTime < replayState.time){
      replayInputDisplay.innerHTML += ' Frame: ' + replayInputs[i].frame;
      replayInputDisplay.innerHTML += ' | Player: ' + '<span style="color: ' + getPlayerColor(replayInputs[i].playerId) + ';">'+ replayInputs[i].playerId + '</span>';
      replayInputDisplay.innerHTML += ' | Input Index: ' + replayInputs[i].i;
      replayInputDisplay.innerHTML += '</br>';
      j--;
      if (j < 0){
        break;
      };
    };
  };
};

function replayDraw(){
  drawState(replayCanvas, replayContext, replayState);
  showLastInputs();
};
