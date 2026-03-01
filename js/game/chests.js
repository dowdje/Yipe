// chests.js — Treasure chest state management

import { ITEMS } from '../data/items.js';

let activeChests = [];
let openedChests = new Set(); // Persisted set of chest IDs (e.g., "cave_1/room_3:chest_0")

export function getOpenedChests() {
  return [...openedChests];
}

export function setOpenedChests(arr) {
  openedChests = new Set(arr || []);
}

export function spawnChests(chestDefs, roomId) {
  activeChests = (chestDefs || []).map((def, i) => {
    const chestId = def.id || `${roomId}:chest_${i}`;
    return {
      ...def,
      chestId,
      opened: openedChests.has(chestId),
    };
  });
}

export function getActiveChests() {
  return activeChests;
}

export function getChestAt(x, y) {
  return activeChests.find(c => c.x === x && c.y === y && !c.opened) || null;
}

/**
 * Open a chest and return its loot items.
 * Returns array of { item, qty } or null if already opened.
 */
export function openChest(chest) {
  if (chest.opened) return null;

  chest.opened = true;
  openedChests.add(chest.chestId);

  // Roll loot from chest's loot table
  const results = [];
  for (const entry of (chest.loot || [])) {
    // Each entry: { itemId, qty?, chance? }
    const chance = entry.chance ?? 1;
    if (Math.random() <= chance) {
      const itemDef = ITEMS[entry.itemId];
      if (itemDef) {
        results.push({ item: itemDef, qty: entry.qty || 1 });
      }
    }
  }

  // Gold reward
  if (chest.gold) {
    results.push({ gold: chest.gold });
  }

  return results;
}

export function clearChests() {
  activeChests = [];
}
