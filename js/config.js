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
  DEATH: 'DEATH',
  CLASS_SELECT: 'CLASS_SELECT',
  CRAFTING: 'CRAFTING',
  PERK: 'PERK',
  COMPENDIUM: 'COMPENDIUM',
  DEBUG: 'DEBUG',
  ENDING: 'ENDING',
};

export const MOVE_TWEEN_MS = 100;
export const TRANSITION_MS = 200;

export const DEATH_FEE_PER_LEVEL = 10;

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
  item: {
    common: '#FFFFFF',
    unique: '#FFD700',
  },
  rarity: {
    common: '#FFFFFF',
    uncommon: '#4CAF50',
    rare: '#2196F3',
    legendary: '#FFD700',
    unique: '#FFD700',
  },
  proc: '#BB66FF',
};

export const DAMAGE_TYPES = {
  physical: 'physical',
  fire: 'fire',
  ice: 'ice',
  lightning: 'lightning',
};

export const DAMAGE_TYPE_COLORS = {
  physical: '#AAAAAA',
  fire: '#FF6B35',
  ice: '#4FC3F7',
  lightning: '#FFD740',
};

// Resistance values: -1 = vulnerable (×1.5), 0 = normal (×1.0), 1 = resist (×0.5), 2 = immune (×0.0)
export const RESISTANCE_LABELS = {
  [-1]: { symbol: '↓', color: '#FF4444', label: 'Weak' },
  [0]:  { symbol: '—', color: '#888888', label: 'Normal' },
  [1]:  { symbol: '↑', color: '#4488FF', label: 'Resist' },
  [2]:  { symbol: '⛨', color: '#AAAAAA', label: 'Immune' },
};

export function getResistanceMultiplier(resistValue) {
  if (resistValue === -1) return 1.5;
  if (resistValue === 1) return 0.5;
  if (resistValue === 2) return 0.0;
  return 1.0;
}

export const ENEMY_TYPES = {
  // Tier 1 (Lv 1+)
  // Target: 3-4 hit kill, player loses 60-80% HP. Back-to-back fights deadly without healing.
  bat: {
    name: 'Bat',
    color: '#8844AA',
    hp: 22, maxHp: 22, atk: 9, def: 2, spd: 7,
    gold: 3, exp: 5,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [],
  },
  slime: {
    name: 'Slime',
    color: '#44BB44',
    hp: 28, maxHp: 28, atk: 10, def: 4, spd: 4,
    gold: 5, exp: 8,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'toxic_goo', chance: 0.40 }],
  },
  // Tier 2 (Lv 3+)
  shadow_bat: {
    name: 'Shadow Bat',
    color: '#6622AA',
    hp: 38, maxHp: 38, atk: 15, def: 5, spd: 9,
    gold: 7, exp: 12,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: -1 },
    materialDrops: [],
  },
  poison_slime: {
    name: 'Poison Slime',
    color: '#AACC22',
    hp: 42, maxHp: 42, atk: 14, def: 7, spd: 5,
    gold: 8, exp: 14,
    resistances: { physical: 0, fire: -1, ice: 1, lightning: 0 },
    materialDrops: [{ material: 'toxic_goo', chance: 0.50 }, { material: 'bio_sample', chance: 0.15 }],
  },
  goblin: {
    name: 'Goblin',
    color: '#CC6633',
    hp: 40, maxHp: 40, atk: 16, def: 6, spd: 6,
    gold: 10, exp: 15,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'scrap_metal', chance: 0.35 }],
  },
  // Tier 3 (Lv 8+)
  cave_troll: {
    name: 'Cave Troll',
    color: '#887766',
    hp: 80, maxHp: 80, atk: 26, def: 12, spd: 3,
    gold: 18, exp: 28,
    resistances: { physical: 1, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'beast_hide', chance: 0.40 }, { material: 'scrap_metal', chance: 0.25 }],
  },
  fire_imp: {
    name: 'Fire Imp',
    color: '#FF5522',
    hp: 55, maxHp: 55, atk: 28, def: 7, spd: 9,
    gold: 15, exp: 25,
    resistances: { physical: 0, fire: 2, ice: -1, lightning: 0 },
    materialDrops: [{ material: 'fuel_cell', chance: 0.30 }],
  },
  // Tier 4 (Lv 12+)
  dark_knight: {
    name: 'Dark Knight',
    color: '#334455',
    hp: 115, maxHp: 115, atk: 36, def: 16, spd: 6,
    gold: 30, exp: 45,
    resistances: { physical: 1, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'scrap_metal', chance: 0.40 }, { material: 'circuit_board', chance: 0.10 }],
  },
  crystal_spider: {
    name: 'Crystal Spider',
    color: '#44DDDD',
    hp: 90, maxHp: 90, atk: 30, def: 10, spd: 11,
    gold: 25, exp: 40,
    resistances: { physical: 0, fire: -1, ice: 1, lightning: 0 },
    materialDrops: [{ material: 'cryo_core', chance: 0.25 }, { material: 'spark_plug', chance: 0.20 }],
  },
  // Tier 5 (Lv 18+)
  ancient_golem: {
    name: 'Ancient Golem',
    color: '#AA8833',
    hp: 175, maxHp: 175, atk: 46, def: 24, spd: 3,
    gold: 50, exp: 70,
    resistances: { physical: 1, fire: 1, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'circuit_board', chance: 0.30 }, { material: 'scrap_metal', chance: 0.50 }],
  },
  chaos_wraith: {
    name: 'Chaos Wraith',
    color: '#AA44CC',
    hp: 140, maxHp: 140, atk: 48, def: 12, spd: 12,
    gold: 45, exp: 65,
    resistances: { physical: -1, fire: 0, ice: 0, lightning: 1 },
    materialDrops: [{ material: 'circuit_board', chance: 0.25 }, { material: 'spark_plug', chance: 0.30 }],
  },
  // Sewer enemies
  sewer_king: {
    name: 'Sewer King',
    color: '#336633',
    hp: 300, maxHp: 300, atk: 22, def: 14, spd: 5,
    gold: 50, exp: 80,
    isBoss: true, bossId: 'sewer_king',
    resistances: { physical: 1, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'beast_hide', chance: 1.0 }],
  },
  sewer_rat: {
    name: 'Sewer Rat',
    color: '#887766',
    hp: 15, maxHp: 15, atk: 8, def: 2, spd: 6,
    gold: 2, exp: 3,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  toxic_slime: {
    name: 'Toxic Slime',
    color: '#66AA33',
    hp: 35, maxHp: 35, atk: 12, def: 5, spd: 4,
    gold: 6, exp: 8,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'toxic_goo', chance: 0.45 }],
  },
  // Underworld enemies
  ghost_intern: {
    name: 'Ghost Intern',
    color: '#88AACC',
    hp: 30, maxHp: 30, atk: 10, def: 2, spd: 6,
    gold: 8, exp: 10,
    resistances: { physical: 1, fire: -1, ice: 0, lightning: -1 },
    materialDrops: [],
  },
  gatekeeper: {
    name: 'Marvin',
    color: '#CC2222',
    hp: 200, maxHp: 200, atk: 35, def: 18, spd: 8,
    gold: 0, exp: 100,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  // Sprawl enemies
  feral_dog: {
    name: 'Feral Dog',
    color: '#AA7744',
    hp: 25, maxHp: 25, atk: 10, def: 4, spd: 7,
    gold: 4, exp: 6,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  feral_rat: {
    name: 'Feral Rat',
    color: '#997755',
    hp: 18, maxHp: 18, atk: 7, def: 3, spd: 8,
    gold: 2, exp: 4,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  goblin_archer: {
    name: 'Goblin Archer',
    color: '#BB7733',
    hp: 32, maxHp: 32, atk: 15, def: 4, spd: 7,
    gold: 8, exp: 12,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'scrap_metal', chance: 0.30 }],
  },
  hoa_enforcer: {
    name: 'HOA Enforcer',
    color: '#445566',
    hp: 80, maxHp: 80, atk: 18, def: 10, spd: 5,
    gold: 25, exp: 30,
    resistances: { physical: -1, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  // Retail enemies
  retail_bot: {
    name: 'Retail Bot',
    color: '#77AACC',
    hp: 30, maxHp: 30, atk: 13, def: 6, spd: 5,
    gold: 6, exp: 10,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'scrap_metal', chance: 0.25 }],
  },
  price_scanner: {
    name: 'Price Scanner',
    color: '#55CC55',
    hp: 25, maxHp: 25, atk: 10, def: 3, spd: 9,
    gold: 5, exp: 8,
    resistances: { physical: 0, fire: 0, ice: -1, lightning: 0 },
    materialDrops: [{ material: 'spark_plug', chance: 0.20 }],
  },
  shopping_cart_golem: {
    name: 'Shopping Cart Golem',
    color: '#888899',
    hp: 60, maxHp: 60, atk: 18, def: 12, spd: 3,
    gold: 12, exp: 20,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'scrap_metal', chance: 0.40 }],
  },
  corrupted_cashier: {
    name: 'Corrupted Cashier',
    color: '#CC6688',
    hp: 45, maxHp: 45, atk: 16, def: 7, spd: 6,
    gold: 10, exp: 15,
    resistances: { physical: -1, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  // Retail boss
  the_manager: {
    name: 'The Manager',
    color: '#224488',
    hp: 400, maxHp: 400, atk: 25, def: 18, spd: 4,
    gold: 75, exp: 120,
    isBoss: true, bossId: 'the_manager',
    resistances: { physical: 0, fire: 0, ice: 1, lightning: -1 },
    materialDrops: [{ material: 'scrap_metal', chance: 1.0 }],
  },
  // Gym enemies
  protein_junkie: {
    name: 'Protein Junkie',
    color: '#DD8855',
    hp: 50, maxHp: 50, atk: 18, def: 5, spd: 5,
    gold: 10, exp: 15,
    resistances: { physical: -1, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  swole_beast: {
    name: 'Swole Beast',
    color: '#BB4444',
    hp: 70, maxHp: 70, atk: 24, def: 8, spd: 4,
    gold: 15, exp: 22,
    resistances: { physical: 0, fire: 0, ice: -1, lightning: 0 },
    materialDrops: [{ material: 'beast_hide', chance: 0.30 }],
  },
  gym_bro: {
    name: 'Gym Bro',
    color: '#DDAA44',
    hp: 55, maxHp: 55, atk: 20, def: 7, spd: 6,
    gold: 12, exp: 18,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [],
  },
  treadmill_monster: {
    name: 'Treadmill Monster',
    color: '#44BB99',
    hp: 40, maxHp: 40, atk: 14, def: 3, spd: 12,
    gold: 8, exp: 14,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  // Gym boss
  the_alpha: {
    name: 'The Alpha',
    color: '#AA2222',
    hp: 500, maxHp: 500, atk: 35, def: 16, spd: 3,
    gold: 100, exp: 160,
    isBoss: true, bossId: 'the_alpha',
    resistances: { physical: 1, fire: 1, ice: -1, lightning: 0 },
    materialDrops: [{ material: 'beast_hide', chance: 1.0 }],
  },
  // Labs enemies
  lab_chimera: {
    name: 'Lab Chimera',
    color: '#AA55AA',
    hp: 80, maxHp: 80, atk: 22, def: 10, spd: 5,
    gold: 18, exp: 28,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'bio_sample', chance: 0.25 }],
  },
  bio_mutant: {
    name: 'Bio-Mutant',
    color: '#66AA44',
    hp: 65, maxHp: 65, atk: 20, def: 8, spd: 6,
    gold: 15, exp: 24,
    resistances: { physical: 0, fire: 0, ice: -1, lightning: 0 },
    materialDrops: [{ material: 'bio_sample', chance: 0.20 }],
  },
  experiment_pod: {
    name: 'Experiment Pod',
    color: '#88CCAA',
    hp: 50, maxHp: 50, atk: 15, def: 15, spd: 3,
    gold: 12, exp: 20,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'circuit_board', chance: 0.15 }],
  },
  rogue_ai: {
    name: 'Rogue AI',
    color: '#44CCFF',
    hp: 55, maxHp: 55, atk: 25, def: 5, spd: 8,
    gold: 14, exp: 22,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'spark_plug', chance: 0.30 }],
  },
  // Labs boss
  the_specimen: {
    name: 'The Specimen',
    color: '#CC44CC',
    hp: 600, maxHp: 600, atk: 28, def: 12, spd: 6,
    gold: 125, exp: 200,
    isBoss: true, bossId: 'the_specimen',
    resistances: { physical: 0, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'circuit_board', chance: 1.0 }, { material: 'bio_sample', chance: 1.0 }],
  },
  // Island enemies
  elite_guard: {
    name: 'Elite Guard',
    color: '#334466',
    hp: 90, maxHp: 90, atk: 28, def: 14, spd: 6,
    gold: 22, exp: 35,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [],
  },
  security_drone: {
    name: 'Security Drone',
    color: '#6688AA',
    hp: 60, maxHp: 60, atk: 22, def: 8, spd: 10,
    gold: 16, exp: 28,
    resistances: { physical: 0, fire: 0, ice: 0, lightning: -1 },
    materialDrops: [{ material: 'spark_plug', chance: 0.25 }],
  },
  cult_acolyte: {
    name: 'Cult Acolyte',
    color: '#663355',
    hp: 45, maxHp: 45, atk: 18, def: 6, spd: 7,
    gold: 12, exp: 20,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  void_wraith: {
    name: 'Void Wraith',
    color: '#553388',
    hp: 120, maxHp: 120, atk: 35, def: 12, spd: 8,
    gold: 30, exp: 50,
    resistances: { physical: -1, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [{ material: 'circuit_board', chance: 0.30 }],
  },
  // Island boss
  the_consultant: {
    name: 'The Consultant',
    color: '#112244',
    hp: 800, maxHp: 800, atk: 40, def: 20, spd: 7,
    gold: 200, exp: 300,
    isBoss: true, bossId: 'the_consultant',
    resistances: { physical: 0, fire: 0, ice: 0, lightning: 0 },
    materialDrops: [],
  },
  // Raccoon (tutorial intro fight)
  raccoon: {
    name: 'Raccoon',
    color: '#776655',
    hp: 12, maxHp: 12, atk: 5, def: 2, spd: 5,
    gold: 1, exp: 3,
    resistances: { physical: 0, fire: -1, ice: 0, lightning: 0 },
    materialDrops: [],
  },
};

// Level-based enemy scaling: each entry defines minLevel and the enemy pool
// Lower tiers never disappear; higher tiers are weighted more as player levels
export const ENEMY_SCALING = [
  { minLevel: 1,  pool: ['bat', 'slime'], weight: 1 },
  { minLevel: 3,  pool: ['shadow_bat', 'poison_slime', 'goblin'], weight: 2 },
  { minLevel: 8,  pool: ['cave_troll', 'fire_imp'], weight: 3 },
  { minLevel: 12, pool: ['dark_knight', 'crystal_spider'], weight: 4 },
  { minLevel: 18, pool: ['ancient_golem', 'chaos_wraith'], weight: 5 },
];

export const PLAYER_DEFAULTS = {
  hp: 30,
  maxHp: 30,
  mp: 10,
  maxMp: 10,
  atk: 5,
  def: 3,
  spd: 4,
  lck: 2,
  int: 2,
  gold: 0,
  level: 1,
  exp: 0,
};

export const SHOP_TYPES = {
  general_store: {
    name: 'Convenience Store',
    color: '#44DDAA',
    inventory: ['gas_station_burrito', 'lukewarm_pizza', 'double_gridlock_burger', 'cheap_energy_drink', 'name_brand_energy_drink', 'antidote_gummy', 'ice_pack', 'hand_warmer', 'scanner'],
  },
  gear_shop: {
    name: 'Pawn Shop',
    color: '#DD8844',
    inventory: ['lead_pipe', 'baseball_bat', 'welding_torch', 'cryo_spray', 'taser', 'wooden_shield', 'chain_mail', 'swift_boots', 'hacker_hoodie', 'luck_charm', 'focus_chip'],
  },
  spell_shop: {
    name: 'Hack Shop',
    color: '#9966FF',
    inventory: ['heal', 'health_siphon', 'shield_aura', 'invisibility', 'resurrect'],
  },
  underworld_shop: {
    name: 'Damned Wares',
    color: '#CC2266',
    inventory: ['soul_cleaver', 'cursed_crown', 'vampiric_ring', 'glass_cannon_charm', 'phantom_boots'],
  },
};

// --- Leveling (balanced) ---
export const MAX_LEVEL = 50;
export function xpForLevel(n) {
  return Math.floor(50 * n * 1.5);
}
export const LEVEL_STAT_GROWTH = {
  hp:  [2, 6],
  mp:  [1, 3],
  atk: [0, 2],
  def: [0, 1],
  spd: [0, 1],
  lck: [0, 1],
  int: [0, 1],
};

export const DIRECTIONS = {
  up:    { dx: 0, dy: -1 },
  down:  { dx: 0, dy: 1 },
  left:  { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
