const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

function deepcopy(obj){
  return JSON.parse(JSON.stringify(obj));
};

function uuid4(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

function randomId(n=32){
  var baseStr = '';
  for (var i = 0; i < n; i++){
    baseStr += 'x';
  };
  return baseStr.replace(/[xy]/g, function(c){
    var r = Math.random() * 36 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(36);
  });
};

function isDefined(x){
  return Boolean((x != null) && (typeof x != 'undefined'));
};


// Files
function fileToText(file, callback){
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    callback(reader.result);
  };
};

// HTML objects
function removeAllChildren(e){
  var child = e.lastElementChild;
  while (child){
    e.removeChild(child);
    child = e.lastElementChild;
  };
};

function removeElementFromArray(array, elem) {
  var index = array.indexOf(elem);
  if (index > -1) {
    array.splice(index, 1);
  };
};

function getDisplayState(condition){
  if (condition){
    return 'block';
  } else {
    return 'none'
  };
};


// Linear algebra
function positionDifference(a, b){
  return {x: b.x - a.x, y: b.y - a.y};
};

function getLookAtRotation(sourcePos, targetPos){
  return Math.atan2((targetPos.y - sourcePos.y), (targetPos.x - sourcePos.x));
};

function getDistanceFromAtoB(a, b){
  return Math.abs(Math.sqrt(Math.pow(b.y - a.y, 2) + Math.pow(b.x - a.x, 2)));
};

function roundPosition(pos){
  return {x: Math.round(pos.x), y: Math.round(pos.y)}
};

function multiplyVectorByInt(vector, x){
  return {x: vector.x*x, y: vector.y*x};
};

function addVectors(a, b){
  return {x: a.x + b.x, y: a.y + b.y};
};

function dotProduct(a, b){
  return (a.x * b.x) + (a.y * b.y);
};

function getOppositeRotation(rotation){
  return rotation + Math.PI;
};

function isFacing(rotA, rotB, tolerance){
  var fwdA = getForwardVector(rotA);
  var fwdB = getForwardVector(rotB);
  var dotProdAB = dotProduct(fwdA, fwdB);
  return Boolean(dotProdAB < (tolerance - 1));
};

function getForwardVector(rotation){
  return {x: Math.cos(rotation), y: Math.sin(rotation)};
};

function getRightVector(rotation){
  return {x: Math.cos(rotation + (Math.PI/2)), y: Math.sin(rotation + (Math.PI/2))};
};

function getPointAtDistance(sourcePos, targetPos, distance){
  var totalDistance = getDistanceFromAtoB(sourcePos, targetPos);
  if (totalDistance != 0){
    var percentDistance = distance / totalDistance;
    var deltaY = targetPos.y - sourcePos.y;
    var deltaX = targetPos.x - sourcePos.x;
    return {x: sourcePos.x + (deltaX*percentDistance), y: sourcePos.y + (deltaY*percentDistance)};
  } else {
    return targetPos;
  };
};

// Binary
function bin2dec(bin){
  return parseInt(bin, 2).toString(10);
};

function dec2bin(dec){
  return (dec >>> 0).toString(2);
};


// Curves
function gaussianCurve(height, offset, width, x){
  return height/Math.pow(Math.E, (Math.pow(x-offset, 2))/(2*width*width));
};

// States
function compareStates(stateA, stateB){
  if (isDefined(stateA) && isDefined(stateB)){
    return Boolean((JSON.stringify(stateA.playerA) == JSON.stringify(stateB.playerA)) && (JSON.stringify(stateA.playerB) == JSON.stringify(stateB.playerB)));
  } else {
    return false;
  };
};

function compareMultipleStates(states){
  var status = true;
  if (states.length > 1){
    for (var i = 1; i < states.length; i++){
      if (!compareStates(states[0], states[i])){
        status = false;
        break;
      };
    };
  };
  return status;
};
