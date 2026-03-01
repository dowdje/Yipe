// perks.js — Perk selection and stat modification for GRIDLOCK

import { PERK_TABLE } from '../data/perks.js';

export function getAvailablePerks(playerLevel, chosenPerks, classId) {
  const entry = PERK_TABLE.find(e => e.level === playerLevel);
  if (!entry) return null;
  const chosenIds = chosenPerks.map(p => p.id || p);
  return entry.options.filter(opt => {
    if (chosenIds.includes(opt.id)) return false;
    if (opt.classReq && opt.classReq !== classId) return false;
    return true;
  });
}

export function applyPerk(perkId, player) {
  if (!player.perks) player.perks = [];
  if (player.perks.find(p => (p.id || p) === perkId)) return false;
  player.perks.push({ id: perkId });
  return true;
}

export function hasPerk(player, perkId) {
  if (!player.perks) return false;
  return player.perks.some(p => (p.id || p) === perkId);
}

export function getPerkModifier(player, type) {
  if (!player.perks) return null;
  for (const perk of player.perks) {
    const perkId = perk.id || perk;
    const def = findPerkDef(perkId);
    if (def && def.effect.type === type) {
      return def.effect;
    }
  }
  return null;
}

export function getAllPerkModifiers(player, type) {
  if (!player.perks) return [];
  const results = [];
  for (const perk of player.perks) {
    const perkId = perk.id || perk;
    const def = findPerkDef(perkId);
    if (def && def.effect.type === type) {
      results.push(def.effect);
    }
  }
  return results;
}

export function isPerkLevel(level) {
  return PERK_TABLE.some(e => e.level === level);
}

function findPerkDef(perkId) {
  for (const entry of PERK_TABLE) {
    const found = entry.options.find(o => o.id === perkId);
    if (found) return found;
  }
  return null;
}
