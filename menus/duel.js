var lastChallengedKey;
var challengerKey;
var hasChallengeBeenAnswered;

// Challenge
function requestChallenge(key){
  console.log('Challenge request to ' + key + ' sent');
  setWaitAcceptanceDisplay();
  lastChallengedKey = key;
  socket.emit('challenge-request', key);
};

function acceptChallenge(key){
  console.log('Challenge accepted');
  socket.emit('challenge-accept', key);
  hasChallengeBeenAnswered = true;
};

function refuseChallenge(key){
  console.log('Challenge refused');
  socket.emit('challenge-refuse', key);
  hasChallengeBeenAnswered = true;
  closeDuelAcceptDisplay();
};

function receiveChallengeRequest(key){
  console.log('Received challenge request from ' + key);
  challengerKey = key;
  setDuelAcceptDisplay();
  timeoutAcceptance(socket, key);
};

async function timeoutAcceptance(socket, key){
  hasChallengeBeenAnswered = false;
  for (var i = 0; i < 10; i ++){
    await sleep(timeToAcceptMatch/10);
    if (hasChallengeBeenAnswered){
      break;
    };
  };
  if (!hasChallengeBeenAnswered){
    refuseChallenge(key);
  };
};



// Challenge buttons
var duelAcceptMenu = document.getElementById("duel-accept-menu");
var duelAcceptProgressBar = document.getElementById("duel-accept-progress-bar");

var waitAcceptanceMenu = document.getElementById("wait-acceptance-menu");
var waitAcceptanceLabel = document.getElementById("wait-acceptance-label");
var resendChallengeButton = document.getElementById("resend-challenge-button");
var waitAcceptanceProgressBar = document.getElementById("wait-acceptance-progress-bar");


// Accept / Refuse
var duelAcceptButton = document.getElementById("duel-accept-button");
var duelRefuseButton = document.getElementById("duel-refuse-button");
duelAcceptButton.addEventListener('click', function(){
  acceptChallenge(challengerKey);
  duelAcceptButton.style.display = 'none';
  duelRefuseButton.style.display = 'none';
});
duelRefuseButton.addEventListener('click', function(){
  refuseChallenge(challengerKey);
});



resendChallengeButton.addEventListener('click', function(){
  sendChallenge(lastChallengedKey);
});



function showOpenChallengePanel(){
  openChallengePanel.style.display = 'block';
};

function hideOpenChallengePanel(){
  openChallengePanel.style.display = 'none';
};

function setDuelAcceptDisplay(){
  document.title = 'Battle - New Challenge';
  mainMenu.style.filter = 'blur(2px)';
  duelAcceptMenu.style.filter = 'none';
  duelAcceptMenu.style.display = 'block';
  duelAcceptButton.style.display = 'block';
  duelRefuseButton.style.display = 'block';
  depleteProgressBar(duelAcceptProgressBar, timeToAcceptMatch);
};

function closeDuelAcceptDisplay(){
  document.title = 'Battle';
  duelAcceptMenu.style.display = 'none';
  mainMenu.style.filter = 'none';
};
