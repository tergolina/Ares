// Environment constants
const floorDepth = Math.round(matchCanvas.height * 0.8);
const healthBarDepth = 30;
const healthBarThickness = 18;
const staminaBarThickness = 10;
const staminaBarDepth = healthBarDepth + healthBarThickness + 8;
const barDistanceFromCenter = Math.round(matchCanvas.width / 16);
const barSizePerPoint = (matchCanvas.width * 0.3)/2000;

// Draw
const characterSize = 512;
const spriteSize = 512;

function loadSpriteSheets(){
  var sheets = {};

  for (var key in projectilesData){
    sheets[key + '_projectile'] = new Image();
    sheets[key + '_projectile'].src = 'visual/sprites/projectiles/' + key + '_projectile.png';
  };

  for (var key in pickupsData){
    sheets[key + '_pickup'] = new Image();
    sheets[key + '_pickup'].src = 'visual/sprites/pickups/' + key + '_pickup.png';
  };

  for (var key in particlesData){
    sheets[key + '_particle'] = new Image();
    sheets[key + '_particle'].src = 'visual/sprites/particles/' + key + '_particle.png';
  };

  for (var key in actionsData){
    sheets[key + '_lance_shield'] = new Image();
    sheets[key + '_lance_shield'].src = 'visual/sprites/actions/' + actionsData[key].type + '/' + key + '_lance_shield.png';
    if (actionsData[key].type == 'dash' || actionsData[key].type == 'idle' || key.endsWith('_charge')){
      sheets[key + '_legs'] = new Image();
      sheets[key + '_legs'].src = 'visual/sprites/legs/' + key + '_legs.png';
    };
  };
  return sheets;
};

var characterImage;
var spriteSheets = loadSpriteSheets();

function drawCharacter(context, playerState){
  var actionData = actionsData[playerState.action.name];
  var bodyName = playerState.action.name + '_' + playerState.mainHand + '_' + playerState.offHand;
  var legName = playerState.action.name + '_legs';

  if (actionData.type == 'idle'){
    var bodyFrame = Math.floor(playerState.action.frame / 20);
  } else {
    var bodyFrame = playerState.action.frame;
  };
  var legFrame = playerState.action.frame % 20;

  // Draw legs
  if ((canMove(playerState) && wantsToMove(playerState)) || (actionData.type == 'dash')){ // (actionData.type == 'idle') &&
    drawSprite(context, playerState.direction, playerState.position, legName, legFrame, spriteSize);
  };
  // Draw body
  drawSprite(context, playerState.rotation, playerState.position, bodyName, bodyFrame, spriteSize);
};


function drawProjectile(context, projectile){
  var totalFrames = projectilesData[projectile.type].frames;
  var currentFrame = Math.floor(projectile.distanceTraveled/projectile.speed) % totalFrames;
  drawSprite(context, projectile.rotation, projectile.position, projectile.type + '_projectile', currentFrame, spriteSize);
};

function drawPickup(context, pickup){
  drawSprite(context, pickup.rotation, pickup.position, pickup.type + '_pickup', 0, spriteSize);
};

function drawParticle(context, particle){
  drawSprite(context, particle.rotation, particle.position, particle.type + '_particle', particle.frame, spriteSize);
};

function drawSprite(context, rotation, position, name, frame, size){
  var adjustedRotation = rotation + Math.PI/2;
  var sheetX = spriteSize*(frame % 5);
  var sheetY = spriteSize*Math.floor(frame / 5) + 1;

  context.translate(position.x, position.y);
  context.rotate(adjustedRotation);
  context.drawImage(spriteSheets[name], sheetX, sheetY, size, size, -size/2, -size/2, size, size);
  context.rotate(-adjustedRotation);
  context.translate(-position.x, -position.y);
};

function drawObject(context, description){
  if (description.type == 'pickup'){
    drawPickup(context, description.object);
  } else if (description.type == 'projectile'){
    drawProjectile(context, description.object);
  } else if (description.type == 'character'){
    drawCharacter(context, description.object);
  } else if (description.type == 'particle'){
    drawParticle(context, description.object);
  };
};

function drawState(canvas, context, state){
  // Clear canvas
  context.fillStyle = '#6A2';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Show objects by order
  var hierarchy = {8: [], 9: [], 10: [{type: 'character', object: state.playerA}, {type: 'character', object: state.playerB}], 11: [], 12: []};

  for (var i = 0; i < state.pickups.length; i++){
    hierarchy[state.pickups[i].order].push({type: 'pickup', object: state.pickups[i]});
  };

  for (var i = 0; i < state.projectiles.length; i++){
    hierarchy[state.projectiles[i].order].push({type: 'projectile', object: state.projectiles[i]});
  };

  for (var i = 0; i < state.particles.length; i++){
    hierarchy[state.particles[i].order].push({type: 'particle', object: state.particles[i]});
  };

  for (var j = 8; j < 13; j++){
    if (j in hierarchy){
      for (var i = 0; i < hierarchy[j].length; i++){
        drawObject(context, hierarchy[j][i]);
      };
    };
  };

  // ---------------------------------------------------------------------------
  // HUD -----------------------------------------------------------------------
  // Show health and blood  bar
  context.fillStyle = '#000';
  context.fillRect(canvasMid - barDistanceFromCenter - (barSizePerPoint * state.playerA.maxHealth), healthBarDepth, (barSizePerPoint * state.playerA.maxHealth), healthBarThickness + 4);
  context.fillRect(canvasMid + barDistanceFromCenter, healthBarDepth, (barSizePerPoint * state.playerB.maxHealth), healthBarThickness + 4);
  context.fillStyle = '#A00';
  context.fillRect(canvasMid - barDistanceFromCenter - (barSizePerPoint * state.playerA.currentBlood) + 2, healthBarDepth + 2, (barSizePerPoint * state.playerA.currentBlood) - 4, healthBarThickness);
  context.fillRect(canvasMid + barDistanceFromCenter + 2, healthBarDepth + 2, (barSizePerPoint * state.playerB.currentBlood) - 4, healthBarThickness);
  context.fillStyle = '#F00';
  context.fillRect(canvasMid - barDistanceFromCenter - (barSizePerPoint * state.playerA.currentHealth) + 2, healthBarDepth + 2, (barSizePerPoint * state.playerA.currentHealth) - 4, healthBarThickness);
  context.fillRect(canvasMid + barDistanceFromCenter + 2, healthBarDepth + 2, (barSizePerPoint * state.playerB.currentHealth) - 4, healthBarThickness);

  if (!hasRoundStarted(state)){
    // Show round start countdown
    context.fillStyle = '#000';
    context.font = "36px Arial";
    context.textAlign = "center";
    var countDown = Math.round(secondsToStartRound - (state.roundFrame/fpsGoal));
    if (countDown > (secondsToStartRound/2)){
      context.fillText('Round ' + state.round, canvasMid-10, Math.round(canvas.height/2)-10);
    } else if (countDown > (secondsToStartRound/4)){
      context.fillText('Ready', canvasMid-10, Math.round(canvas.height/2)-10);
    } else {
      context.fillText('Start', canvasMid-10, Math.round(canvas.height/2)-10);
    };
  } else {
    // Show round time
    context.fillStyle = '#000';
    context.font = "28px Arial";
    context.textAlign = "center";
    context.fillText(Math.round((state.roundFrame / fpsGoal) - secondsToStartRound), canvasMid, healthBarDepth + 20);
  };

  //----------------------------------------------------------------------------
  // Stats ---------------------------------------------------------------------
  context.fillStyle = '#000';
  context.font = "16px Arial";

  context.textAlign = "left";
  // Show current fps
  context.fillText(state.fps + ' fps', 10, 25);
  // Show latency
  context.fillText(Math.round(state.serverLatency) + ' ms', 10, 50);
  context.fillText(Math.round(state.opponentLatency) + ' ms', 10, 75);
  // Show current frame
  context.fillText('frame ' + state.frame, 10, canvas.height - 35);
  // Show machine time
  context.fillText('time ' + state.machineTime, 10, canvas.height - 10);

  // Show version
  context.textAlign = "right";
  context.fillText('v' + clientVersion, canvas.width - 10, canvas.height - 10);
};

function drawMatch(canvas, context, match){
  drawState(canvas, context, match.currentState);

  //----------------------------------------------------------------------------
  // Show round wins
  context.fillStyle = '#000';
  var aWins = 0;
  var bWins = 0;
  for (var i = 0; i < match.rounds.length; i++){
    if (match.rounds[i].winner == match.currentState.playerA.id){
      context.fillRect(canvasMid - barDistanceFromCenter - aWins*20 - 10, healthBarDepth + healthBarThickness + 20, 10, 10);
      aWins ++;

    } else if (match.rounds[i].winner == match.currentState.playerB.id){
      context.fillRect(canvasMid + barDistanceFromCenter + bWins*20, healthBarDepth + healthBarThickness + 20, 10, 10);
      bWins ++;
    };
  };
  //----------------------------------------------------------------------------
};


// //----------------------------------------------------------------------------
// // DEBUG ---------------------------------------------------------------------
// if (debugMode){
//   // Line trace
//   context.fillStyle = '#F00';
//   for (var i = 0; i < lastTracedLine.length; i++){
//     context.fillRect(lastTracedLine[i].x, lastTracedLine[i].y, 1, 1);
//   };
//
//   // Sync
//   if (lastReceivedSync != {}){
//     var latency = (Date.now() - matchStartTime) - lastReceivedSync.matchTime;
//     var expectedFramesAhead = Math.floor(latency * fpsGoal / 1000);
//     var opponentsCurrentFrame = lastReceivedSync.frame + expectedFramesAhead;
//     var actualFramesAhead = currentState.frame - lastReceivedSync.frame;
//     var frameDisparity = currentState.frame - opponentsCurrentFrame;
//
//     context.fillStyle = '#000';
//     context.font = "16px Arial";
//     context.textAlign = "right";
//     context.fillText('My frame: ' + currentState.frame, canvas.width - 10, 25);
//     context.fillText('Opponent frame: ' + opponentsCurrentFrame, canvas.width - 10, 50);
//     context.fillText('Frame disparity: ' + (frameDisparity), canvas.width - 10, 75);
//     context.fillText('Time to sync: ' + Math.round(timeToSync) + ' | ' + Math.round(frameDisparity * 1000 / fpsGoal), canvas.width - 10, 100);
//     context.fillText('Sleep time: ' + Math.round(sleepTime), canvas.width - 10, 125);
//   };
//   // Inputs
//   if (isDefined(lastConfirmedInput)){
//     context.fillText('Last confirmed input: ' + lastConfirmedInput.i, canvas.width - 10, 160);
//   };
//   context.fillText('Input index: ' + inputIndex, canvas.width - 10, 185);
//   context.fillText('Unconfirmed inputs: ' + previousInputs.length, canvas.width - 10, 210);
//   // States
//   context.fillText('Last confirmed frame: ' + lastConfirmedFrame, canvas.width - 10, 245);
// };
