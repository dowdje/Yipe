// save.js — localStorage save/load (GRIDLOCK v1: fresh start with class system)

import { getOpenedChests } from '../game/chests.js';

const SAVE_KEY = 'gridlock_save_v1';

// Old keys to clean up
const OLD_KEYS = ['grymhold_save_v3', 'grymhold_save_v2'];

export function saveGame(roomId, playerX, playerY, player) {
  const playerState = player ? {
    hp: player.hp,
    maxHp: player.maxHp,
    mp: player.mp,
    maxMp: player.maxMp,
    atk: player.atk,
    def: player.def,
    spd: player.spd,
    lck: player.lck,
    int: player.int || 2,
    gold: player.gold,
    level: player.level,
    exp: player.exp,
    classId: player.classId,
    inventory: player.inventory,
    equipment: serializeEquipment(player.equipment),
    spells: player.spells,
    abilities: player.abilities,
    // Phase 5-6 fields
    materials: player.materials || {},
    questFlags: player.questFlags || {},
    activeQuests: player.activeQuests || [],
    completedQuests: player.completedQuests || [],
    questProgress: player.questProgress || {},
    perks: player.perks || [],
    compendium: player.compendium || {},
    dangerMeter: player.dangerMeter || 0,
    knownRecipes: player.knownRecipes || [],
    trainCount: player.trainCount || {},
    lastSafeRoom: player.lastSafeRoom || null,
    difficulty: player.difficulty || 1.0,
    playtime: player.playtime || 0,
    bossesDefeated: player.bossesDefeated || [],
  } : null;

  const data = {
    roomId, playerX, playerY, playerState,
    chestsOpened: getOpenedChests(),
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function serializeEquipment(equipment) {
  if (!equipment) return null;
  const result = {};
  for (const [slot, item] of Object.entries(equipment)) {
    result[slot] = item ? { id: item.id } : null;
  }
  return result;
}

export function loadSave() {
  try {
    // Try GRIDLOCK v1
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }

    // Old Grymhold saves are ignored — player starts fresh with GRIDLOCK
    // Clean up old keys
    for (const key of OLD_KEYS) {
      localStorage.removeItem(key);
    }

    return null;
  } catch (e) {
    console.warn('Load failed:', e);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  for (const key of OLD_KEYS) {
    localStorage.removeItem(key);
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function getSaveInfo() {
  const save = loadSave();
  if (!save || !save.playerState) return null;
  const p = save.playerState;
  return {
    classId: p.classId,
    level: p.level,
    playtime: p.playtime || 0,
    timestamp: save.timestamp,
    roomId: save.roomId,
  };
}
