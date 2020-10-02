// User data
var privateKey;
var publicKey;

function createNewUser(){
  privateKey = randomId(n=64);
  window.localStorage.setItem('private-key', privateKey);
  publicKey = 'u_' + randomId();
  window.localStorage.setItem('public-key', publicKey);
  console.log('Created new user. PublicKey: ' + publicKey);
  promptCreateUserName();
};

function promptCreateUserName(){
  document.title = 'Battle - New Character';
  var characterCreateMenu = document.getElementById('character-create-menu');
  characterCreateMenu.style.display = 'block';
  mainMenu.style.filter = 'blur(2px)';

  document.getElementById('character-create-button').addEventListener('click', function(){
    var name = document.getElementById('character-create-name-input').value;
    if (isValidName(name)){
      window.localStorage.setItem('character-name', name);
      characterCreateMenu.style.display = 'none';
      mainMenu.style.filter = 'none';
      login();
    };
  });
};

function loadUserData(){
  privateKey = window.localStorage.getItem('private-key');
  publicKey = window.localStorage.getItem('public-key');
  characterName = window.localStorage.getItem('character-name');

  document.getElementById('my-character-name-label').innerText = characterName;
};

function hasUserData(){
  loadUserData();
  return Boolean(privateKey != null);
};

function login(){
  loadUserData();
  console.log('Requesting login as ' + publicKey);
  socket.emit('login-request', {privateKey: privateKey, publicKey: publicKey, name: characterName});
};

function isPlayerA(state, key){
  return Boolean(state.playerA.id == key);
};

function isUserIvalidated(){
  return false;
};

function isValidName(name){
  return true;
};
