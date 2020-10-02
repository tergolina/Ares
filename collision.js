
function columnTraceFrom(state, sourcePos, rotation, distance, width, ignore=[]){
  lastTracedLine = [];
  var traceResult = {success: false};
  var rightVector = getRightVector(rotation);
  var rightOffset = -width/2;
  while (rightOffset <= width/2){
    var adjustedSourcePos = addVectors(sourcePos, multiplyVectorByInt(rightVector, rightOffset));
    traceResult = lineTraceFrom(state, adjustedSourcePos, rotation, distance, ignore);
    if (traceResult.success){
      break;
    } else {
      rightOffset += 10;
    };
  };
  return traceResult;
};


function lineTraceBetween(state, sourcePos, targetPos, ignore=[]){
  var rotation = getLookAtRotation(sourcePos, targetPos);
  var distance = getDistanceFromAtoB(sourcePos, targetPos);
  return lineTraceFrom(state, sourcePos, rotation, distance, ignore);
};

var lastTracedLine = [];
function lineTraceFrom(state, sourcePos, rotation, distance, ignore=[]){
  var hit = {success: false};

  var forwardVector = getForwardVector(rotation);
  var targetPos = roundPosition({x: sourcePos.x + distance*forwardVector.x,
                                 y: sourcePos.y + distance*forwardVector.y});
  var collisionPos = {x: sourcePos.x, y: sourcePos.y};

  for (var i = 0; i < distance; i++){
    hit = checkCollision(state, collisionPos, ignore);
    if (hit.success){
      break;
    };
    collisionPos.y += forwardVector.y;
    collisionPos.x += forwardVector.x;

    lastTracedLine.push(deepcopy(collisionPos));
  };

  return hit;
};

function checkCollision(state, pos, ignore=[]){
  var hit = {success: false};
  var players = ['playerA', 'playerB'];
  for (var i = 0; i < 2; i++){
    if (ignore.indexOf(players[i]) < 0){
      var actionData = actionsData[state[players[i]].action.name];
      if (actionData.type != 'death'){
        if (getDistanceFromAtoB(pos, state[players[i]].position) <= state[players[i]].width){
          hit = {success: true, target: players[i], position: pos};
          console.log(hit);
          break;
        };
      };
    };
  };
  return hit;
};

function clampHorizontal(x){
  return Math.min(Math.max(x, minX), maxX);
};

function clampVertical(y){
  return Math.min(Math.max(y, minY), maxY);
};
