const defaultState = {
  machineTime: 0,
  serverLatency: 0,
  opponentLatency: 0,
  round: 1,
  roundFrame: 0,
  frame: 0,
  time: 0,
  fps: 0,
  rewound: false,
  pickups: [],
  projectiles: [],
  particles: [],
  playerA: {
    id: '',
    rounds: 0,
    maxHealth: baseHealth,
    currentHealth: baseHealth,
    currentBlood: baseHealth,
    direction: 0,
    rotation: 0,
    position: {x: canvasMid - 600, y: 500},
    inputBuffer: [],
    input: {},
    action: {
      name: 'idle',
      frame: 0
    },
    fatigue: 0,
    ammo: 5,
    mainHand: 'lance',
    offHand: 'shield',
    width: 60,
    targetPosition: {}
  },
  playerB: {
    id: '',
    rounds: 0,
    maxHealth: baseHealth,
    currentHealth: baseHealth,
    currentBlood: baseHealth,
    direction: 0,
    rotation: -Math.PI,
    position: {x: canvasMid + 600, y: 500},
    inputBuffer: [],
    input: {},
    action: {
      name: 'idle',
      frame: 0
    },
    fatigue: 0,
    ammo: 5,
    mainHand: 'lance',
    offHand: 'shield',
    width: 60,
    targetPosition: {}
  }
};
