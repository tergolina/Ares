const clientVersion = '1.1.27';
console.log(clientVersion);
var debugMode = true;


simulationLock = new Lock('Simulation');

async function keepUpdated(match){
  var lastTime = 0;
  while (!match.report.ended){
    var time = Date.now();
    match.currentState.fps = Math.round(1000 / (time - lastTime));
    lastTime = time;

    // Start match
    if (!match.matchStarted && match.matchStartTime > 0 && time >= match.matchStartTime){
      match.matchStarted = true;
    };

    if (match.matchStarted){
      await simulationLock.acquire();
      match.update(time);
      await simulationLock.release();
    };

    drawMatch(matchCanvas, matchContext, match);

    var elapsed = Date.now() - time;
    var sleepTime = (1000/fpsGoal) + match.timeToSync - elapsed;
    match.timeToSync = 0;
    await sleep(sleepTime);
  };

  socket.emit('match-end', match.report);
  match.saveAsReplayFile();
};

async function keepInSync(match){
  while (!match.report.ended){
    if (match.matchStarted){
      sendFrameSync(match);
    };
    await sleep(1000/(syncFrequency*fpsGoal));
  };
};
