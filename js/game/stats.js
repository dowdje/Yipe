// stats.js — Derived stat computation from base stats + equipment + status effects

import { getStatusMods } from './status-effects.js';
import { getAllPerkModifiers } from './perks.js';

/**
 * Compute effective stats = base + all equipment bonuses + status effect multipliers.
 * Optional statuses param: array of status entries (from combat.playerStatuses).
 * If a statusSource object with .statuses is provided, status mods are applied.
 * Returns object with effective atk/def/spd/lck and _atkBonus/_defBonus etc.
 */
export function getEffectiveStats(player, statusSource) {
  let atkBonus = 0;
  let defBonus = 0;
  let spdBonus = 0;
  let lckBonus = 0;
  let intBonus = 0;

  for (const item of Object.values(player.equipment)) {
    if (!item) continue;
    if (item.power) atkBonus += item.power;
    if (item.defense) defBonus += item.defense;
    if (item.bonus) {
      if (item.bonus.atk) atkBonus += item.bonus.atk;
      if (item.bonus.def) defBonus += item.bonus.def;
      if (item.bonus.spd) spdBonus += item.bonus.spd;
      if (item.bonus.lck) lckBonus += item.bonus.lck;
      if (item.bonus.int) intBonus += item.bonus.int;
    }
  }

  let atk = player.atk + atkBonus;
  let def = player.def + defBonus;
  let spd = player.spd + spdBonus;
  const lck = player.lck + lckBonus;
  let int = (player.int || 2) + intBonus;

  // Apply status effect multipliers if a status source is provided
  if (statusSource && statusSource.statuses && statusSource.statuses.length > 0) {
    const mods = getStatusMods(statusSource);
    atk = Math.floor(atk * (1 + mods.atk));
    def = Math.floor(def * (1 + mods.def));
    spd = Math.floor(spd * (1 + mods.spd));
    spd = Math.max(1, spd); // SPD floor of 1
  }

  // Apply perk stat multipliers
  const statMultPerks = getAllPerkModifiers(player, 'statMult');
  for (const perk of statMultPerks) {
    if (perk.stat === 'atk') atk = Math.floor(atk * perk.value);
    else if (perk.stat === 'def') def = Math.floor(def * perk.value);
    else if (perk.stat === 'spd') spd = Math.floor(spd * perk.value);
    else if (perk.stat === 'int') int = Math.floor(int * perk.value);
  }

  return {
    atk,
    def,
    spd,
    lck,
    int,
    _atkBonus: atkBonus,
    _defBonus: defBonus,
    _spdBonus: spdBonus,
    _lckBonus: lckBonus,
    _intBonus: intBonus,
  };
}

/**
 * Compute effective stats for an enemy, applying status effect modifiers.
 * Enemy has base stats directly (no equipment).
 */
export function getEnemyEffectiveStats(enemy) {
  let { atk, def, spd } = enemy;

  if (enemy.statuses && enemy.statuses.length > 0) {
    const mods = getStatusMods(enemy);
    atk = Math.floor(atk * (1 + mods.atk));
    def = Math.floor(def * (1 + mods.def));
    spd = Math.floor(spd * (1 + mods.spd));
    spd = Math.max(1, spd);
  }

  return { atk, def, spd };
}

/**
 * Crit chance based on effective luck.
 * Base 5% + 0.5% per luck point.
 */
export function getCritChance(effectiveStats, player) {
  let crit = 0.05 + effectiveStats.lck * 0.005;
  if (player) {
    const critPerks = getAllPerkModifiers(player, 'critBonus');
    for (const perk of critPerks) {
      crit += perk.value;
    }
  }
  return crit;
}
