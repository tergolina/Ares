
function canMove(playerState){
  var actionData = actionsData[playerState.action.name];
  var currentFrame = playerState.action.frame;

  if (currentFrame >= actionData.unlockMovement){
    return true;
  } else if (currentFrame < actionData.lockMovement){
    return true
  } else {
    return false;
  };
};

function canRotate(playerState){
  var actionData = actionsData[playerState.action.name];
  var currentFrame = playerState.action.frame;

  if (currentFrame >= actionData.unlockRotation){
    return true;
  } else if (currentFrame < actionData.lockRotation){
    return true
  } else {
    return false;
  };
};

function wantsToRotate(playerState){
  return Boolean(playerState.input != {});
};

function wantsToMove(playerState){
  if (playerState.input == {}){
    return false;
  } else {
    if (playerState.input.w || playerState.input.a || playerState.input.s || playerState.input.d){
      return Boolean((!(playerState.input.w && playerState.input.s)) && (!(playerState.input.a && playerState.input.d)));
    } else {
      return false;
    };
  };
};

function calculateMovementSpeed(playerState){
  var actionData = actionsData[playerState.action.name];
  var currentFrame = playerState.action.frame;
  var speed = baseMoveSpeed;
  if (playerState.action.name.endsWith('_charge')){
    speed = baseMoveSpeed * 0.5;
  };
  if (playerState.action.name == 'guard'){
    speed = baseMoveSpeed * 0.6;
  };
  return Math.max(0, speed);
};

function calculateMovementDirection(playerState){
  var direction = 0;
  if (playerState.input != {}){
    if (playerState.input.w){
      if (playerState.input.a){
        direction = - Math.PI / 4;
      } else if (playerState.input.d){
        direction = Math.PI / 4;
      };
    } else if (playerState.input.s){
      if (playerState.input.a){
        direction = - Math.PI * 3 / 4;
      } else if (playerState.input.d){
        direction = Math.PI * 3 / 4;
      } else {
        direction = Math.PI;
      };
    } else if (playerState.input.a){
      direction = - Math.PI / 2;
    } else if (playerState.input.d){
      direction = Math.PI / 2;
    };
  };
  playerState.direction = direction - (Math.PI/2);
  return playerState.direction;
};

function calculateDashSpeed(playerState){
  var dashData = actionsData[playerState.action.name].dash;
  var currentFrame = playerState.action.frame;
  var avgSpeed = dashData.distance/(dashData.endFrame - dashData.startFrame);
  var percentLeft = (dashData.endFrame - currentFrame)/(dashData.endFrame - dashData.startFrame);
  return avgSpeed * percentLeft;
};

function calculateDashDirection(playerState){
  var dashData = actionsData[playerState.action.name].dash;
  var currentFrame = playerState.action.frame;
  if (dashData.startFrame == currentFrame){
    if (dashData.method == 'target'){
      playerState.direction = getLookAtRotation(playerState.position, playerState.input);
    } else if (dashData.method == 'movement'){
      playerState.direction = calculateMovementDirection(playerState);
    };
  };
  if (dashData.method == 'rotation'){
    playerState.direction = playerState.rotation;
  };
  return playerState.direction;
};

function movePlayer(playerState, speed, direction){
  playerState.position = roundPosition({
    x: clampHorizontal(playerState.position.x + speed * Math.cos(direction)),
    y: clampVertical(playerState.position.y + speed * Math.sin(direction))
  });
};
