
// Match Utils
function hasRoundStarted(state){
  return Boolean((state.roundFrame / fpsGoal) > secondsToStartRound);
};

function isDead(playerState){
  var actionData = actionsData[playerState.action.name];
  return Boolean(actionData.type == 'death' && playerState.action.frame >= actionData.recoverToIdle);
};

function generateRoundReport(state){
  var report = {ended: false, winner: '', reason: '', round: state.round, frame: state.frame};
  if (state.roundFrame >= matchDuration){
    report.reason = 'timeout';
    report.ended = true;
    report.winner = whoHasMoreHealth(state);
  } else if (isDead(state.playerA)){
    report.reason = 'death';
    report.ended = true;
    report.winner = state.playerB.id;
  } else if (isDead(state.playerB)){
    report.reason = 'death';
    report.ended = true;
    report.winner = state.playerA.id;
  };
  return report;
};

function whoHasMoreHealth(state){
  var winner = '';
  if (state.playerA.currentHealth > state.playerB.currentHealth){
    winner = state.playerA.id;
  } else if (state.playerB.currentHealth > state.playerA.currentHealth){
    winner = state.playerB.id;
  };
  return winner;
};

function getEndText(){
  if (liveMatch.report.winner == ''){
    return 'Draw';
  } else if (liveMatch.report.winner == publicKey){
    return 'Victorious';
  } else {
    return 'Defeated';
  };
};


// State Utils

function getLocalPlayerState(matchState){
  var playerState;
  if (matchState.playerA.id == publicKey){
    playerState = matchState.playerA;
  } else {
    playerState = matchState.playerB;
  };
  return playerState;
};

function getOpponentPlayerState(matchState){
  var playerState;
  if (matchState.playerA.id !== publicKey){
    playerState = matchState.playerA;
  } else {
    playerState = matchState.playerB;
  };
  return playerState;
};

function getPlayerState(matchState, id){
  var playerState;
  if (matchState.playerA.id == id){
    playerState = matchState.playerA;
  } else {
    playerState = matchState.playerB;
  };
  return playerState;
};

function getOppositePlayerState(matchState, playerState){
  if (JSON.stringify(playerState) == JSON.stringify(matchState.playerA)){
    return matchState.playerB;
  } else {
    return matchState.playerA;
  };
};

function getOppositePlayerID(id){
  if (id != currentState.playerA.id){
    return currentState.playerA.id;
  } else {
    return currentState.playerB.id;
  };
};

// Simulation Utils
function canSwitchAction(currentAction, newAction){
  var currentActionData = actionsData[currentAction.name];
  var newActionData = actionsData[newAction.name];

  if (newActionData.type == 'attack'){
    if (currentAction.name.endsWith('_charge')){
      return Boolean(currentAction.name == newAction.name + '_charge');
    } else {
      return Boolean(currentAction.frame >= currentActionData.recoverToAttack);
    };

  } else if (newActionData.type == 'dash'){
    return Boolean(currentAction.frame >= currentActionData.recoverToDash);

  } else if (newActionData.type == 'idle'){
    return Boolean(currentAction.frame >= currentActionData.recoverToIdle || ((currentAction.name != newAction.name) && (currentActionData.type == 'idle')));

  } else if (newActionData.type == 'interact'){
    return Boolean(currentAction.frame >= currentActionData.recoverToIdle || (currentActionData.type == 'idle'));

  } else {
    return false;
  };
};

function getIntendedAction(state, playerState, previusInput, input){
  if (input != {}){
    if (playerState.action.name == 'throw_charge'){
      if (((!input.rmb) && previusInput.rmb) || (playerState.action.frame == (actionsData[playerState.action.name].recoverToIdle - 1))){
        return 'throw';

      } else {
        return 'idle';
      };

    } if (playerState.action.name == 'thrust_charge'){
      if (((!input.lmb) && previusInput.lmb) || (playerState.action.frame == (actionsData[playerState.action.name].recoverToIdle - 1))){
        return 'thrust';

      } else {
        return 'idle';
      };

    } else {
      if (input.lmb && (!previusInput.lmb)){
        return 'thrust_charge';

      } else if (input.rmb && (!previusInput.rmb) && hasAmmo(playerState)){
        return 'throw_charge';

      } else if (input.spacebar && (!previusInput.spacebar) && wantsToMove(playerState)){
        return 'dash';

      } else if (input.shift){
        return 'guard';

      } else if (input.e && (!previusInput.e) && (!hasAmmo(playerState)) && hasPickupNearby(state, playerState)){
        return 'pickup';

      } else {
        return 'idle';
      };
    };
  } else {
    return 'idle';
  };
};

function getBufferedAction(state, playerState){
  var inputBuffer = playerState.inputBuffer;
  var action = 'idle';
  var newAction;
  if (hasRoundStarted(state)){
    for (var i = 1; i < inputBuffer.length; i++){
      newAction = getIntendedAction(state, playerState, inputBuffer[i-1], inputBuffer[i]);
      if (actionsData[newAction].priority >= actionsData[action].priority){
        action = newAction;
      };
    };
  };
  return action;
};


function calculateDamage(instigator, target, attackData){
  return attackData.attack.damage;
};

function applyDamage(playerState, damage){
  playerState.currentBlood = playerState.currentHealth;
  playerState.currentHealth -= damage;
  if (playerState.currentHealth <= 0){
    playerState.action = {name: 'dead', frame: 0};
  };
};

function hitTarget(state, targetPlayer, instigator, collision, damage){
  if (isGuarding(targetPlayer) && isFacing(targetPlayer.rotation, instigator.rotation, 0.3)){
    blockHit(targetPlayer);
    spawnParticle('spark', state, collision.position, getOppositeRotation(instigator.rotation));
    return 'blocked';
  } else {
    targetPlayer.rotation = getOppositeRotation(instigator.rotation);
    takeHit(targetPlayer);
    applyDamage(targetPlayer, damage);
    spawnParticle('blood', state, collision.position, getOppositeRotation(instigator.rotation));
    return 'hit';
  };
};

function takeHit(playerState){
  setPlayerAction(playerState, {name: 'stagger', frame: 0});
};

function blockHit(playerState){
  setPlayerAction(playerState, {name: 'block', frame: 0});
};

function spawnParticle(type, state, position, rotation){
  state.particles.push({
    type: type,
    order: 11,
    frame: 0,
    position: position,
    rotation: rotation
  });
};

function activateParticle(state, particle){
  var particleData = particlesData[particle.type];
  if ('pickup' in particleData){
    // Spawna um pickup se houver
    state.pickups.push({
      type: particleData.pickup,
      order: 8,
      position: particle.position,
      rotation: particle.rotation
    });
  };
};

function despawnParticle(state, particle){
  // Remove particle
  var i = state.particles.indexOf(particle);
  if (i > -1){
    state.particles.splice(i, 1);
  };
};

function despawnProjectile(state, projectile){
  var projectileData = projectilesData[projectile.type];
  if ('pickup' in projectileData){
    // Spawna um pickup se houver
    state.pickups.push({
      type: projectileData.pickup,
      order: 8,
      owner: projectile.owner,
      position: projectile.position,
      rotation: projectile.rotation
    });
  };
  // Remove projetil
  var i = state.projectiles.indexOf(projectile);
  if (i > -1){
    state.projectiles.splice(i, 1);
  };
};

function pickupObject(state, playerState, pickup){
  if (pickup.type == 'lance'){
    playerState.ammo++;
  };
  // Remove pickup
  var i = state.pickups.indexOf(pickup);
  if (i > -1){
    state.pickups.splice(i, 1);
  };
};

function canPickup(playerState, pickup){
  return Boolean(pickup.type == 'lance');
};

function hasPickupNearby(state, playerState){
  var range = actionsData['pickup'].pickup.range;
  return isDefined(getClosestPickupWithinRange(state, playerState, range));
};

function getClosestPickupWithinRange(state, playerState, range){
  var distance = -1;
  var closest;
  for (var i = 0; i < state.pickups.length; i++){
    var d = getDistanceFromAtoB(playerState.position, state.pickups[i].position);
    if (d < range && canPickup(playerState, state.pickups[i])){
      if ((distance < 0) || (d < distance)){
        distance = d;
        closest = state.pickups[i];
      };
    };
  };
  return closest
};

function isGuarding(playerState){
  return Boolean(playerState.action.name == 'guard');
};

function isDashing(playerState){
  if ('dash' in actionsData[playerState.action.name]){
    var dashData = actionsData[playerState.action.name].dash;
    var currentFrame = playerState.action.frame;
    return Boolean(currentFrame >= dashData.startFrame && currentFrame < dashData.endFrame);
  } else {
    return false;
  };
};

function hasAmmo(playerState){
  return Boolean(playerState.ammo > 0);
};

function calculateFatigue(playerState, newAction){
  playerState.fatigue = Math.max(Math.min(playerState.fatigue + actionsData[newAction].fatigue, maxFatigue), 0);
  return playerState.fatigue;
};

function calculateBleedStrength(playerState){
  return 4;
};

function applyBleed(playerState, bleed){
  playerState.currentBlood = Math.max(playerState.currentBlood - bleed, playerState.currentHealth);
};

function setPlayerAction(playerState, action){
  var actionData = actionsData[action.name];
  var isRepeating = Boolean(actionsData[playerState.action.name].type == actionsData[action.name].type);
  var isStagger = Boolean(actionData.type == 'stagger');
  if (isRepeating || isStagger){
    calculateFatigue(playerState, action.name);
  };
  if (playerState.fatigue > 0 && ((action.name + '_' + playerState.fatigue) in actionsData)){
    action.name += '_' + playerState.fatigue;
  };
  playerState.action = action;
  if (!(isRepeating || isStagger)){
    calculateFatigue(playerState, action.name);
  };
};

function getInputPrediction(match, state, playerState){
  var newInput = playerState.input;
  for (var i = match.receivedInputs.length-1; i >= 0; i--){
    if ((match.receivedInputs[i].frame == state.frame) && (match.receivedInputs[i].playerId == playerState.id)){
      newInput = match.receivedInputs[i].input;
      break;
    };
  };
  return newInput;
};

function clearParticles(state){
  state.particles = [];
};

function clearPickups(state){
  state.pickups = [];
};

function clearProjectiles(state){
  state.projectiles = [];
};

function resetPlayerState(state, player){
  var id = state[player].id;
  state[player] = defaultState[player];
  state[player].id = id;
};

function clearRedundantRounds(match, round){
  for (var i = match.rounds.length-1; i >= 0; i--){
    if (match.rounds[i].round == round){
      match.rounds.splice(i, 1);
    };
  };
};

function simulate(match, previousState, fromRewind=false){
  var nextState = deepcopy(previousState);

  // Test if the round ended
  var report = generateRoundReport(nextState);
  if (report.ended){
    console.log('ROUND ENDED');
    console.log(nextState);

    clearParticles(nextState);
    clearPickups(nextState);
    clearProjectiles(nextState);
    resetPlayerState(nextState, 'playerA');
    resetPlayerState(nextState, 'playerB');

    nextState.roundFrame = 0;
    nextState.round ++;

    clearRedundantRounds(match, report.round);
    match.rounds.push(report);

  } else {
    if (fromRewind){
      console.log(previousState);
    };

    // Avança um frame
    nextState.machineTime = Date.now();
    nextState.time = Date.now() - match.matchStartTime;
    nextState.frame ++;
    nextState.roundFrame ++;
    nextState.rewound = fromRewind;

    // Advance particle effects
    for (var i = 0; i < nextState.particles.length; i++){
      var particle = nextState.particles[i]
      var particleData = particlesData[particle.type];
      particle.frame++;
      if (('activeFrame' in particleData) && particle.frame == particleData.activeFrame){
        activateParticle(nextState, particle);
      };
      if (particle.frame >= particleData.frames){
        despawnParticle(nextState, particle);
      };
    };

    var players = ['playerA', 'playerB'];

    // Switch action
    for (var playerIndex = 0; playerIndex < 2; playerIndex++){
      var selectedPlayer = players[playerIndex];
      var playerState = nextState[selectedPlayer];
      var oppositePlayer = players[1 - playerIndex];

      shiftInputBuffer(playerState);
      var predictedInput = getInputPrediction(match, nextState, playerState);
      playerState.inputBuffer[playerState.inputBuffer.length-1] = predictedInput;
      playerState.input = predictedInput;

      var previousAction = previousState[selectedPlayer].action;
      var intendedAction = {name: getBufferedAction(nextState, playerState), frame: 0};

      if (canSwitchAction(previousAction, intendedAction)){
        setPlayerAction(playerState, intendedAction);
      } else {
        playerState.action.frame ++;
      };
    };

    // Move, rotate and dash
    for (var playerIndex = 0; playerIndex < 2; playerIndex++){
      var selectedPlayer = players[playerIndex];
      var playerState = nextState[selectedPlayer];

      if (canRotate(playerState) && wantsToRotate(playerState)){
        playerState.rotation = getLookAtRotation(playerState.position, playerState.input);
      };

      if (canMove(playerState) && wantsToMove(playerState) && hasRoundStarted(nextState)){
        var speed = calculateMovementSpeed(playerState);
        var direction = calculateMovementDirection(playerState);
        movePlayer(playerState, speed, direction);
      };

      if (isDashing(playerState)){
        var speed = calculateDashSpeed(playerState);
        var direction = calculateDashDirection(playerState);
        movePlayer(playerState, speed, direction);
      };
    };

    // Attack and interact
    for (var playerIndex = 0; playerIndex < 2; playerIndex++){
      var selectedPlayer = players[playerIndex];
      var playerState = nextState[selectedPlayer];
      var oppositePlayer = players[1 - playerIndex];
      var opponentState = nextState[oppositePlayer];

      var actionData = actionsData[playerState.action.name];
      var targetActionData = actionsData[opponentState.action.name];

      if ('attack' in actionData){
        var attackData = actionData.attack;
        if (attackData.frame == playerState.action.frame){
          var collision = columnTraceFrom(nextState, calculateOffsetFromPlayer(playerState, actionData.attack.offset), playerState.rotation, attackData.range, attackData.width, [selectedPlayer]);
          if (collision.success){
            if (collision.target == oppositePlayer){
              hitTarget(nextState, opponentState, playerState, collision, attackData.damage);
            };
          };
        };
      };

      if ('projectile' in actionData && hasAmmo(playerState)){
        var projectileData = actionData.projectile;
        if (projectileData.frame == playerState.action.frame){
          // Spawn projectile
          playerState.ammo--;
          nextState.projectiles.push({type: projectileData.type,
                                      order: 11,
                                      ignore: [selectedPlayer],
                                      owner: selectedPlayer,
                                      speed: projectileData.speed,
                                      damage: projectileData.damage,
                                      rotation: playerState.rotation,
                                      width: projectileData.width,
                                      position: calculateOffsetFromPlayer(playerState, projectileData.offset),
                                      distanceTraveled: 0,
                                      distanceLimit: projectileData.distance});
        };
      };

      if ('pickup' in actionData){
        var pickupData = actionData.pickup;
        if (playerState.action.frame == pickupData.frame){
          var closestPickup = getClosestPickupWithinRange(nextState, playerState, pickupData.range);
          if (isDefined(closestPickup) && canPickup(playerState, closestPickup)){
            pickupObject(nextState, playerState, closestPickup);
          };
        };
      };

      // Bleed
      var bleedStrength = calculateBleedStrength(opponentState);
      applyBleed(opponentState, bleedStrength);
    };

    // Projectiles
    for (var i = 0; i < nextState.projectiles.length; i++){
      var projectile = nextState.projectiles[i];
      var rotation = projectile.rotation;
      var speed = projectile.speed;
      var pos = projectile.position;
      var newPos = addVectors(multiplyVectorByInt(getForwardVector(rotation), speed), pos);

      // Checa se o projetil chegou no range maximo
      if (projectile.distanceTraveled > projectile.distanceLimit){
        despawnProjectile(nextState, projectile);
      } else {
        // Testa colisao
        var collision = columnTraceFrom(nextState, pos, projectile.rotation, 1, projectile.width, projectile.ignore);
        if (collision.success){
          // Colisao com um player
          var hitResult = hitTarget(nextState, nextState[collision.target], projectile, collision, projectile.damage);
          if (hitResult == 'blocked'){
            despawnProjectile(nextState, projectile);
          } else if (hitResult == 'hit'){
            projectile.order = 9;
            projectile.speed = speed * (1/2);
            projectile.ignore.push(collision.target);
            projectile.distanceLimit = projectile.distanceTraveled + (projectile.speed * 3);
          };
        } else {
          projectile.distanceTraveled = projectile.distanceTraveled + getDistanceFromAtoB(pos, newPos);
          nextState.projectiles[i].position = newPos;
        };
      };
    };

  };

  if (fromRewind){
    console.log(nextState);
  };

  return nextState;
};

function calculateOffsetFromPlayer(playerState, offset){
  var fwdVector = getForwardVector(playerState.rotation);
  var rightVector = getRightVector(playerState.rotation);

  var rotatedFwdVector = {x: fwdVector.x * offset.y, y: fwdVector.y * offset.y}
  var rotatedRightVector = {x: rightVector.x * offset.x, y: rightVector.y * offset.x}
  var rotatedOffsetVector = addVectors(rotatedFwdVector, rotatedRightVector);
  return addVectors(playerState.position, rotatedOffsetVector);
};

function rewind(match, i){
  if (i < match.matchStates.length - 1 & i >= 0){
    console.log('Rewinding ' + (match.matchStates.length - 1 - i) + ' frames from frame ' + match.currentState.frame);

    for (var j = i; j < match.matchStates.length - 1; j++){
      console.log('Generating state ' + (j+1));
      match.matchStates[j+1] = simulate(match, match.matchStates[j], true);
    };
    match.setCurrentState(match.matchStates[match.matchStates.length-1]);
  };
};
