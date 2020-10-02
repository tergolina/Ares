// Challenge Menu
var challengeMenu = document.getElementById('challenge-menu');


var upperPanelRow = document.getElementById('upper-panel-row');
var lowerPanelRow = document.getElementById('lower-panel-row');

var joinQueuePanelButton = document.getElementById('join-queue-panel-button');
var duelPanelButton = document.getElementById('duel-panel-button');

var queueOptionsMenu = document.getElementById("queue-options-menu");


var matchHistoryMenu = document.getElementById('match-history-menu');
var dropArea = document.getElementById('drop-area');
var selectFileButton = document.getElementById('choose-file-button');
var dropFileLabel = document.getElementById('drop-label');


var mainMenu = document.getElementById('main-menu');

var sideMenu = document.getElementById('side-menu');

// Spectate
var spectateMenu = document.getElementById('spectate-menu');

var waitSpectateMenu = document.getElementById('wait-spectate-menu');

var customSpectateMenu = document.getElementById('custom-spectate-menu');

var spectateHistoryMenu = document.getElementById('spectate-history-menu');
var spectateHistoryForm = document.getElementById('spectate-history-form');

var spectateCanvas = document.getElementById('spectate-canvas');
var spectateContext = spectateCanvas.getContext('2d');



// Replay
var replayMenu = document.getElementById('replay-menu');
var replayCanvas = document.getElementById('replay-canvas');
var replayContext = replayCanvas.getContext('2d');

var replayPlayPauseButton = document.getElementById('play-pause-button');
var replaySpeedSelect = document.getElementById("replay-speed");
var replayInputDisplay = document.getElementById("input-history-display");



// Match
var matchCanvas = document.getElementById('match-canvas');
var matchContext = matchCanvas.getContext('2d');

const canvasMid = Math.round(matchCanvas.width/2);


document.addEventListener('contextmenu', (e)=> {
  e.preventDefault();
  return false;
});

var progressBarDepletingData = {};
async function depleteProgressBar(progressBar, time){
  var isAlreadyDepleting = Boolean(progressBar.id in progressBarDepletingData);

  progressBarDepletingData[progressBar.id] = {started: Date.now(), time: time};
  progressBar.value = progressBar.max;
  progressBar.style.display = 'block';

  if (!isAlreadyDepleting){
    while (progressBar.value > 0){
      elapsed = Date.now() - progressBarDepletingData[progressBar.id].started;
      progressBar.value = ((progressBarDepletingData[progressBar.id].time - elapsed) / progressBarDepletingData[progressBar.id].time) * 100;
      await sleep(30);
    };
    delete progressBarDepletingData[progressBar.id];
  };
};


function setMatchDisplay(){
  document.title = 'Battle - Match';
  matchCanvas.style.display = 'block';
  matchCanvas.style.filter = 'none';
  mainMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  rematchMenu.style.display = 'none';
};

function setSpectateDisplay(){
  setMenuDisplay();
  document.title = 'Battle - Spectate';
  waitAcceptanceMenu.style.display = 'none';
  matchHistoryMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  challengeMenu.style.display = 'none';
  spectateMenu.style.display = 'block';
  replayMenu.style.display = 'none';
  sideMenu.style.filter = 'none';

  spectateCanvas.style.display = 'block';
  waitSpectateMenu.style.display = 'none';
  customSpectateMenu.style.display = 'none';
  spectateHistoryMenu.style.display = 'none';
  spectateScoreboardButton.style.display = getDisplayState(isDefined(currentLobbyState));
};

function setWaitSpectateDisplay(){
  setMenuDisplay();
  document.title = 'Battle - Spectate';
  waitAcceptanceMenu.style.display = 'none';
  matchHistoryMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  challengeMenu.style.display = 'none';
  spectateMenu.style.display = 'block';
  replayMenu.style.display = 'none';

  spectateCanvas.style.display = 'none';
  waitSpectateMenu.style.display = 'block';
  customSpectateMenu.style.display = 'none';
  spectateHistoryMenu.style.display = 'none';
};

function setSpectateMenuDisplay(){
  setMenuDisplay();
  waitAcceptanceMenu.style.display = 'none';
  matchHistoryMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  challengeMenu.style.display = 'none';
  spectateMenu.style.display = 'block';
  replayMenu.style.display = 'none';

  spectateCanvas.style.display = 'none';
  waitSpectateMenu.style.display = 'none';
  customSpectateMenu.style.display = 'block';
  spectateHistoryMenu.style.display = 'block';
  updateSpectateHistoryDisplay();
};

function setReplayDisplay(){
  setMenuDisplay();
  document.title = 'Battle - Replay';
  waitAcceptanceMenu.style.display = 'none';
  matchHistoryMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  challengeMenu.style.display = 'none';
  spectateMenu.style.display = 'none';
  replayMenu.style.display = 'block';
};

function setMenuDisplay(){
  document.title = 'Battle';
  matchCanvas.style.display = 'none';
  rematchMenu.style.display = 'none';
  mainMenu.style.display = 'block';
  mainMenu.style.filter = 'none';
  sideMenu.style.filter = 'block';
};

function setResendChallengeDisplay(){
  resendChallengeButton.style.display = 'block';
  waitAcceptanceProgressBar.style.display = 'none';
};

function setWaitAcceptanceDisplay(){
  setMenuDisplay();
  waitAcceptanceMenu.style.display = 'block';
  matchHistoryMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  challengeMenu.style.display = 'none';
  spectateMenu.style.display = 'none';
  replayMenu.style.display = 'none';

  resendChallengeButton.style.display = 'none';
  depleteProgressBar(waitAcceptanceProgressBar, timeToAcceptMatch);
};

function setHomeDisplay(){
  setMenuDisplay();
  waitAcceptanceMenu.style.display = 'none';
  matchHistoryMenu.style.display = 'none';
  duelAcceptMenu.style.display = 'none';
  challengeMenu.style.display = 'block';
  spectateMenu.style.display = 'none';
  replayMenu.style.display = 'none';

  upperPanelRow.style.display = 'block';
  lowerPanelRow.style.display = 'block';
  queueOptionsMenu.style.display = 'none';
  lobbyOptionsMenu.style.display = 'none';
};



// Drag and drop match files
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false)
});

function preventDefaults(e){
  e.preventDefault()
  e.stopPropagation()
};

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false)
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false)
});

function highlight(e){
  dropFileLabel.innerText = 'Drop file';
  selectFileButton.style.display = 'none';
  dropArea.classList.add('highlight')
};

function unhighlight(e){
  dropFileLabel.innerText = 'Drag and drop match file';
  selectFileButton.style.display = 'block';
  dropArea.classList.remove('highlight');
};

dropArea.addEventListener('drop', function(e){
  fileToText(e.dataTransfer.files[0], function(data){
    // setupReplay(data);
    setupDebug(data);
  });
});


function toggleElementDisplay(element, displayType='block'){
  if (element.style.display == 'block' || element.style.display == 'inline-block'){
    element.style.display = 'none';
  } else {
    element.style.display = displayType;
  };
};



// Main menu panels
function setQueueOptionsDisplay(){
  setHomeDisplay();
  upperPanelRow.style.display = 'none';
  lowerPanelRow.style.display = 'none';
  queueOptionsMenu.style.display = 'block';
};

function setLobbyOptionsDisplay(){
  setHomeDisplay();
  upperPanelRow.style.display = 'none';
  lowerPanelRow.style.display = 'none';
  lobbyOptionsMenu.style.display = 'block';
};

joinQueuePanelButton.addEventListener('click', function(){
  setQueueOptionsDisplay();
});



window.addEventListener('mouseup', function(e){
  var hideableDivs = document.getElementsByClassName('hideable');
  for (var i = 0; i < hideableDivs.length; i++){
    if (!hideableDivs[i].contains(e.target)){
      hideableDivs[i].style.display = 'none';
    };
  };
});



var openChallengePanel = document.getElementById('open-challenge-menu');
var openInviteLinkInput = document.getElementById('open-invite-link-input');

function setOpenInviteLink(inviteTo='challenge'){
  openInviteLinkInput.value = location.origin + '/?' + inviteTo + '=' + publicKey;
};


var friendLinkSelectButton = document.getElementById("friend-link-select-button");
var duelLinkSelectButton = document.getElementById("duel-link-select-button");
var spectateLinkSelectButton = document.getElementById("spectate-link-select-button");

friendLinkSelectButton.addEventListener('click', function(){
  switchToFriendLinkPanel();
});
duelLinkSelectButton.addEventListener('click', function(){
  switchToDuelLinkPanel();
});
spectateLinkSelectButton.addEventListener('click', function(){
  switchToSpectateLinkPanel();
});

function switchToFriendLinkPanel(){
  friendLinkSelectButton.style['border-bottom-width'] = '0px';
  spectateLinkSelectButton.style['border-bottom-width'] = '1px';
  duelLinkSelectButton.style['border-bottom-width'] = '1px';
  document.getElementById("open-link-title").innerText = "Friend link";
  setOpenInviteLink('friend');
};

function switchToDuelLinkPanel(){
  duelLinkSelectButton.style['border-bottom-width'] = '0px';
  spectateLinkSelectButton.style['border-bottom-width'] = '1px';
  friendLinkSelectButton.style['border-bottom-width'] = '1px';
  document.getElementById("open-link-title").innerText = "Duel link";
  setOpenInviteLink('challenge');
};

function switchToSpectateLinkPanel(){
  spectateLinkSelectButton.style['border-bottom-width'] = '0px';
  duelLinkSelectButton.style['border-bottom-width'] = '1px';
  friendLinkSelectButton.style['border-bottom-width'] = '1px';
  document.getElementById("open-link-title").innerText = "Spectate link";
  setOpenInviteLink('spectate');
};

document.getElementById('copy-open-invite-link-button').addEventListener('click', function(){
  openInviteLinkInput.select();
  document.execCommand('copy');
});

document.getElementById('whatsapp-open-invite-link-button').addEventListener('click', function(){
  window.open('https://web.whatsapp.com/send?text=' + openInviteLinkInput.value, '_blank');
});
