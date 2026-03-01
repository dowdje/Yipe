// config.js — Game constants and configuration

export const TILE_SIZE = 32;
export const GRID_COLS = 16;
export const GRID_ROWS = 12;
export const CANVAS_WIDTH = TILE_SIZE * GRID_COLS;  // 512
export const CANVAS_HEIGHT = TILE_SIZE * GRID_ROWS; // 384

export const GAME_STATES = {
  TITLE: 'TITLE',
  OVERWORLD: 'OVERWORLD',
  COMBAT: 'COMBAT',
  DIALOGUE: 'DIALOGUE',
  MENU: 'MENU',
  SHOP: 'SHOP',
  TRANSITION: 'TRANSITION',
};

export const MOVE_TWEEN_MS = 100;
export const TRANSITION_MS = 200;

export const COLORS = {
  background: '#111111',
  player: '#FFD700',
  hud: {
    bg: 'rgba(0, 0, 0, 0.7)',
    text: '#FFFFFF',
    hp: '#22CC44',
    hpBg: '#442222',
    mp: '#4488FF',
    mpBg: '#222244',
    gold: '#FFD700',
  },
  combat: {
    bg: '#1a1a2e',
    panel: '#16213e',
    panelBorder: '#0f3460',
    text: '#FFFFFF',
    textDim: '#888899',
    enemyHp: '#CC3333',
    enemyHpBg: '#442222',
    menuSelect: '#FFD700',
    menuNormal: '#AAAABB',
    logText: '#CCCCDD',
    flash: 'rgba(255, 255, 255, 0.6)',
  },
  shop: {
    bg: '#1a1a2e',
    panel: '#16213e',
    panelBorder: '#0f3460',
    text: '#FFFFFF',
    textDim: '#888899',
    gold: '#FFD700',
    menuSelect: '#FFD700',
    menuNormal: '#AAAABB',
    bought: '#22CC44',
    noGold: '#CC3333',
  },
};

export const ENEMY_TYPES = {
  bat: {
    name: 'Bat',
    color: '#8844AA',
    hp: 8,
    maxHp: 8,
    atk: 3,
    def: 1,
    spd: 6,
    gold: 3,
    exp: 5,
  },
  slime: {
    name: 'Slime',
    color: '#44BB44',
    hp: 12,
    maxHp: 12,
    atk: 4,
    def: 2,
    spd: 2,
    gold: 5,
    exp: 8,
  },
  goblin: {
    name: 'Goblin',
    color: '#CC6633',
    hp: 18,
    maxHp: 18,
    atk: 6,
    def: 3,
    spd: 4,
    gold: 10,
    exp: 15,
  },
};

export const PLAYER_DEFAULTS = {
  hp: 30,
  maxHp: 30,
  mp: 10,
  maxMp: 10,
  atk: 5,
  def: 3,
  spd: 4,
  lck: 2,
  gold: 0,
  level: 1,
  exp: 0,
};

export const SHOP_TYPES = {
  potion_shop: {
    name: 'Potion Shop',
    color: '#44DDAA',
    inventory: ['hp_potion', 'mp_potion'],
  },
  gear_shop: {
    name: 'Gear Shop',
    color: '#DD8844',
    inventory: ['atk_ring', 'def_shield', 'spd_boots'],
  },
};

export const DIRECTIONS = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
