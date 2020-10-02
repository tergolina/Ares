

function setupDebug(strDebugData){
  var debugData = JSON.parse(strDebugData);
  debugStates = debugData.states;
  debugInputs = debugData.inputs;

  setReplayDisplay();

  debug(debugStates, debugInputs);
};

async function debug(states, inputs){
  if (states.length > 0){
    var startData = {time: 0, aID: states[0].playerA.id, bID: states[0].playerB.id};
    var match = new Match();
    match.setup(startData);
    var j = 0;
    while (!match.currentState.report.ended){
      for (var i = j; i < inputs.length; i++){
        if (inputs[i].frameWhenReceived == match.currentState.frame){
          console.log(inputs[i]);
          await receiveInput(match, inputs[i]);
        } else {
          j = i;
          break;
        };
      };
      match.update();
      var l = 0;
      for (var k = l; k < states.length; k++){
        if (states[k].frame == match.currentState.frame){
          if (!compareMultipleStates([states[k], match.currentState])){
            console.log('States did not match at frame ' + states[k].frame);
          };
        } else {
          l = k;
          break;
        };
      };
      drawMatch(replayCanvas, replayContext, match);
      await sleep(10);
    };
  };
};
