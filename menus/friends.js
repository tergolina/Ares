
var friendList = [];
loadLocalFriendList();
refreshFriendListPanels();


function saveLocalFriendList(){
  console.log('Stored friend list');
  console.log(friendList);
  window.localStorage.setItem('friend-list', JSON.stringify(friendList));
};

function loadLocalFriendList(){
  var storedList = window.localStorage.getItem('friend-list');
  console.log('Loaded friend list');
  console.log(storedList);
  if (storedList == null){
    friendList = [];
    saveLocalFriendList();
  } else {
    friendList = JSON.parse(storedList);
  };
};

function isFriend(id){
  var response = false;
  if (id == publicKey){
    response = true;
  } else {
    for (var i = 0; i < friendList.length; i++){
      if (friendList[i].id == id){
        response = true;
        break;
      };
    };
  };
  return response;
};

function requestFriendship(friendId){
  if (!isFriend(friendId)){
    socket.emit('friendship-request', friendId);
  };
};


function addToFriendList(friend){
  console.log('Added ' + friend.id + ' to friend list');
  console.log(friendList);
  loadLocalFriendList();
  friendList.push(friend);
  saveLocalFriendList();
  refreshFriendListPanels();
};

function removeFromFriendList(friendId){
  console.log('Removed ' + friendId + ' from friend list');
  console.log(friendList);
  loadLocalFriendList();
  for (var i = 0; i < friendList.length; i++){
    if (friendList[i].id == friendId){
      friendList.splice(i, 1);
      break;
    };
  };
  saveLocalFriendList();
  refreshFriendListPanels();
  console.log(friendList);
};

var selectedFriendId;
var friendOptionsMenu = document.getElementById('friend-options-menu');
function refreshFriendListPanels(){
  var friendsMenuElement = document.getElementById("friends-menu");
  removeAllChildren(friendsMenuElement);

  for (var i = 0; i < friendList.length; i++){
    var friendPanel = document.createElement('div');
    friendPanel.setAttribute('class', 'friend-panel');

    var friendNameLabel = document.createElement('label');
    friendNameLabel.setAttribute('class', 'friend-name-label');
    friendNameLabel.innerText = friendList[i].name;
    friendPanel.appendChild(friendNameLabel);

    var friendStatusLabel = document.createElement('label');
    friendStatusLabel.setAttribute('class', 'friend-status-label');
    friendStatusLabel.innerText = friendList[i].status;
    friendPanel.appendChild(friendStatusLabel);

    var friendPanelButton = document.createElement('button');
    friendPanelButton.setAttribute('class', 'transparent-button');

    friendPanelButton.friendId = friendList[i].id;
    friendPanelButton.addEventListener('click', function(e){
      selectedFriendId = e.target.friendId;
      friendOptionsMenu.style.display = 'inline-block';
      friendOptionsMenu.style.position = 'absolute';
      friendOptionsMenu.style.top = rawMousePosition.y + 'px';
      friendOptionsMenu.style.left = rawMousePosition.x + 'px';
    });
    friendPanel.appendChild(friendPanelButton);

    var hr = document.createElement('hr');
    hr.setAttribute('class', 'title-hr');
    friendPanel.appendChild(hr);

    friendsMenuElement.appendChild(friendPanel);
  };
};


function updateFriendList(updatedFriendData){
  for (var i = 0; i < friendList.length; i++){
    if (friendList[i].id in updatedFriendData){
      console.log(updatedFriendData[friendList[i].id]);
      friendList[i] = updatedFriendData[friendList[i].id];

      friendList[i].status = 'available';
    } else {
      friendList[i].status = 'offline';
    };
  };
  refreshFriendListPanels();
};




document.getElementById("friend-options-details-button").addEventListener('click', function(){
  friendOptionsMenu.style.display = 'none';
});
document.getElementById("friend-options-spectate-button").addEventListener('click', function(){
  requestSpectate(selectedFriendId);
  friendOptionsMenu.style.display = 'none';
});
document.getElementById("friend-options-duel-button").addEventListener('click', function(){
  requestChallenge(selectedFriendId);
  friendOptionsMenu.style.display = 'none';
});
document.getElementById("friend-options-join-button").addEventListener('click', function(){
  friendOptionsMenu.style.display = 'none';
});
document.getElementById("friend-options-invite-button").addEventListener('click', function(){
  invitePlayerToLobby(selectedFriendId);
  friendOptionsMenu.style.display = 'none';
});
document.getElementById("friend-options-remove-button").addEventListener('click', function(){
  removeFromFriendList(selectedFriendId);
  friendOptionsMenu.style.display = 'none';
});
