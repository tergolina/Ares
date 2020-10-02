var liveMatch;

class Match{
  constructor(){
    this.id = '';
    this.timeToSync = 0;
    this.syncControl = 0;

    this.receivedInputs = [];
    this.expectedInputIndex = 0;
    this.lastReceivedInput = {};

    this.inputIndex = 0;
    this.previousInputs = [];
    this.pendingInputs = [];

    this.totalRounds = 3;
    this.rounds = [];
    this.report = {
      id: '',
      ended: false,
      winner: ''
    };

    this.live = false;
    this.matchStartTime = 0;
    this.matchStarted = false;
    this.matchStates = [deepcopy(defaultState)];
    this.currentState = this.matchStates[this.matchStates.length-1];
  };

  setup(startData){
    this.id = startData.id;
    this.report.id = startData.id;
    this.currentState.playerA.id = startData.aID;
    this.currentState.playerB.id = startData.bID;

    this.live = Boolean(('time' in startData) && (startData['time'] > 0));
    if (this.live){
      this.matchStartTime = Date.now();
    };
    this.matchStarted = true;
  };

  update(){ // Advance to next state
    this.matchStates.push(simulate(this, this.matchStates[this.matchStates.length-1]));
    this.setCurrentState(this.matchStates[this.matchStates.length-1]);
    this.applyPendingInputs();
  };

  updateReport(){
    var winsByPlayer = {};
    for (var i = 0; i < this.rounds.length; i++){
      var winner = this.rounds[i].winner;
      if (winner != ''){
        if (!(winner in winsByPlayer)){
          winsByPlayer[winner] = 0;
        };
        winsByPlayer[winner]++;
        if (winsByPlayer[winner] > (this.totalRounds/2)){
          this.report.winner = winner;
          this.report.ended = true;
          break;
        };
      };
    };
  };

  setCurrentState(state){
    this.currentState = state;
    this.updateReport();
  };

  savePendingInput(inputData){
    this.pendingInputs.push(inputData);
  };

  applyPendingInputs(){
    for (var i = 0; i < this.pendingInputs.length; i++){
      if (this.pendingInputs[i].frame == this.currentState.frame){
        var playerState = getPlayerState(this.currentState, this.pendingInputs[i].playerId);
        saveInputToBuffer(playerState, this.pendingInputs[i].input);
      } else if (this.pendingInputs[i].frame > this.currentState.frame){
        break;
      };
    };
  };

  saveAsReplayFile(){
    const a = document.createElement("a");
    var replayData = {states: this.matchStates, inputs: this.receivedInputs}
    a.href = URL.createObjectURL(new Blob([JSON.stringify(replayData)], {type: "text/plain"}));
    a.setAttribute("download", "replay_" + clientVersion + ".txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  getStateIndexAtFrame(frame){
    return this.matchStates.length + frame - this.currentState.frame - 1;
  };
};
