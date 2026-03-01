// player.js — Player state and movement logic

import { PLAYER_DEFAULTS, GRID_COLS, GRID_ROWS, MOVE_TWEEN_MS } from '../config.js';
import { CLASSES } from '../data/classes.js';
import { CLASS_ABILITIES } from '../data/class-abilities.js';
import { getEnemyAt } from './enemies.js';
import { getShopAt, getChestAt, getNpcAt, getCampfireAt } from './world.js';

const player = {
  x: 0,
  y: 0,
  // Tween state
  moving: false,
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  moveStart: 0,
  // Stats
  ...structuredClone(PLAYER_DEFAULTS),
  // Class
  classId: null,
  // Inventory & equipment
  inventory: [],    // [{ id, name, qty }]
  equipment: {
    weapon: null,
    shield: null,
    helm: null,
    chest: null,
    boots: null,
    accessory1: null,
    accessory2: null,
  },
  spells: [],       // [{ id, name }]
  abilities: [],    // [{ id, name }]
};

export function getPlayer() {
  return player;
}

export function setPlayerPos(x, y) {
  player.x = x;
  player.y = y;
  player.moving = false;
}

export function tryMove(dx, dy, isWalkable) {
  if (player.moving) return null;

  const nx = player.x + dx;
  const ny = player.y + dy;

  // Check for room exit
  if (nx < 0) return 'left';
  if (nx >= GRID_COLS) return 'right';
  if (ny < 0) return 'up';
  if (ny >= GRID_ROWS) return 'down';

  // Check collision
  if (!isWalkable(nx, ny)) return null;

  // Check for shop NPC at destination
  const shop = getShopAt(nx, ny);
  if (shop) {
    return { type: 'shop', shop };
  }

  // Check for NPC at destination
  const npc = getNpcAt(nx, ny);
  if (npc) {
    return { type: 'npc', npc };
  }

  // Check for campfire at destination
  const campfire = getCampfireAt(nx, ny);
  if (campfire) {
    return { type: 'campfire', campfire };
  }

  // Check for chest at destination
  const chest = getChestAt(nx, ny);
  if (chest) {
    return { type: 'chest', chest };
  }

  // Check for enemy at destination
  const enemy = getEnemyAt(nx, ny);
  if (enemy) {
    return { type: 'combat', enemy };
  }

  // Start tween
  player.moving = true;
  player.fromX = player.x;
  player.fromY = player.y;
  player.toX = nx;
  player.toY = ny;
  player.moveStart = performance.now();

  return 'moved';
}

export function updateMovement(now) {
  if (!player.moving) return;

  const elapsed = now - player.moveStart;
  if (elapsed >= MOVE_TWEEN_MS) {
    player.x = player.toX;
    player.y = player.toY;
    player.moving = false;
  }
}

export function getMoveTween(now) {
  if (!player.moving) return null;
  const t = Math.min((now - player.moveStart) / MOVE_TWEEN_MS, 1);
  return { fromX: player.fromX, fromY: player.fromY, toX: player.toX, toY: player.toY, t };
}

export function resetStats(classId) {
  if (classId && CLASSES[classId]) {
    initClass(classId);
  } else {
    Object.assign(player, structuredClone(PLAYER_DEFAULTS));
    player.classId = null;
    player.inventory = [];
    player.equipment = {
      weapon: null, shield: null, helm: null, chest: null,
      boots: null, accessory1: null, accessory2: null,
    };
    player.spells = [];
    player.abilities = [];
  }
}

/**
 * Initialize player with a class. Sets stats, equips starting weapon, grants Lv1 abilities.
 */
export function initClass(classId) {
  const cls = CLASSES[classId];
  if (!cls) return;

  player.classId = classId;

  // Set starting stats
  const stats = cls.startingStats;
  player.hp = stats.hp;
  player.maxHp = stats.maxHp;
  player.mp = stats.mp;
  player.maxMp = stats.maxMp;
  player.atk = stats.atk;
  player.def = stats.def;
  player.spd = stats.spd;
  player.lck = stats.lck;
  player.int = stats.int || 2;
  player.gold = 0;
  player.level = 1;
  player.exp = 0;

  player.inventory = [];
  player.equipment = {
    weapon: null, shield: null, helm: null, chest: null,
    boots: null, accessory1: null, accessory2: null,
  };
  player.spells = [];
  player.abilities = [];

  // Grant Lv1 abilities
  grantAbilitiesUpToLevel(player, 1);
}

/**
 * Grant all class abilities up to a given level (for init and migration).
 */
export function grantAbilitiesUpToLevel(player, level) {
  if (!player.classId) return;
  const abilities = CLASS_ABILITIES[player.classId] || [];
  for (const ability of abilities) {
    if (ability.passive) continue; // passives aren't listed
    if (ability.learnLevel <= level) {
      if (!player.abilities.find(a => a.id === ability.id)) {
        player.abilities.push({ id: ability.id, name: ability.name });
      }
    }
  }
}

/**
 * Add item to inventory. Stackable items increment qty.
 */
export function addToInventory(player, itemDef, qty = 1) {
  if (itemDef.stackable) {
    const existing = player.inventory.find(i => i.id === itemDef.id);
    if (existing) {
      existing.qty += qty;
      return;
    }
  }
  player.inventory.push({ id: itemDef.id, name: itemDef.name, qty });
}

/**
 * Remove item from inventory (1 qty for stackables, or entire entry).
 * Returns true if removed.
 */
export function removeFromInventory(player, itemId) {
  const idx = player.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return false;

  const entry = player.inventory[idx];
  if (entry.qty > 1) {
    entry.qty--;
  } else {
    player.inventory.splice(idx, 1);
  }
  return true;
}

/**
 * Equip an item. If slot is occupied, unequip old item back to inventory.
 * Removes item from inventory.
 */
export function equipItem(player, itemDef) {
  if (!itemDef.slot) return false;

  // Determine actual slot — accessories can go in either slot
  let slot = itemDef.slot;
  if (itemDef.type === 'accessory') {
    if (player.equipment.accessory1 && !player.equipment.accessory2) {
      slot = 'accessory2';
    } else {
      slot = 'accessory1';
    }
  }

  // Unequip current item in that slot
  const current = player.equipment[slot];
  if (current) {
    addToInventory(player, current);
  }

  // Remove from inventory
  removeFromInventory(player, itemDef.id);

  // Equip
  player.equipment[slot] = itemDef;
  return true;
}

/**
 * Unequip item from slot, return to inventory.
 */
export function unequipSlot(player, slot) {
  const item = player.equipment[slot];
  if (!item) return false;

  addToInventory(player, item);
  player.equipment[slot] = null;
  return true;
}
